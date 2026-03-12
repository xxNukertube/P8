import jsPDF from 'jspdf';
import { TrocaServicoData } from '../types';
import { calculateEndDateTime, formatPeriodText } from './dateUtils';

const renderRichText = (doc: jsPDF, textBlocks: {text: string, bold: boolean}[], startX: number, startY: number, maxWidth: number, lineHeight: number = 6, justify: boolean = false) => {
  let lines: { word: string, bold: boolean, width: number, isSpace: boolean }[][] = [];
  let currentLine: { word: string, bold: boolean, width: number, isSpace: boolean }[] = [];
  let currentLineWidth = 0;

  textBlocks.forEach(block => {
    doc.setFont('times', block.bold ? 'bold' : 'normal');
    const tokens = block.text.split(/(\s+)/);
    tokens.forEach(token => {
      if (!token) return;
      doc.setFont('times', block.bold ? 'bold' : 'normal');
      const tokenWidth = doc.getTextWidth(token);
      const isSpace = /^\s+$/.test(token);

      if (!isSpace && currentLineWidth + tokenWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [{ word: token, bold: block.bold, width: tokenWidth, isSpace: false }];
        currentLineWidth = tokenWidth;
      } else {
        if (isSpace && currentLine.length === 0 && lines.length > 0) return;
        currentLine.push({ word: token, bold: block.bold, width: tokenWidth, isSpace });
        currentLineWidth += tokenWidth;
      }
    });
  });
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  let currentY = startY;
  lines.forEach((line, lineIndex) => {
    while (line.length > 0 && line[line.length - 1].isSpace) {
      line.pop();
    }

    let lineWidth = line.reduce((sum, token) => sum + token.width, 0);
    let spaceCount = line.filter(t => t.isSpace).length;
    let extraSpace = 0;

    if (justify && lineIndex < lines.length - 1 && spaceCount > 0) {
      extraSpace = (maxWidth - lineWidth) / spaceCount;
    }

    let currentX = startX;
    line.forEach(token => {
      doc.setFont('times', token.bold ? 'bold' : 'normal');
      if (token.isSpace) {
        currentX += token.width + extraSpace;
      } else {
        doc.text(token.word, currentX, currentY);
        currentX += token.width;
      }
    });
    currentY += lineHeight;
  });
};

export const generatePDF = async (data: TrocaServicoData) => {
  const doc = new jsPDF();
  doc.setLineHeightFactor(1.0);
  
  // Helper to get the actual value (handling "Outro" fields)
  const getValue = (val: string, outroVal: string) => val === 'Outro' ? outroVal : val;

  const grandeComando = getValue(data.grandeComando, data.grandeComandoOutro).toUpperCase();
  const unidade = getValue(data.unidade, data.unidadeOutro).toUpperCase();
  const subunidade = getValue(data.subunidade, data.subunidadeOutro).toUpperCase();
  const frenteServico = getValue(data.frenteServico, data.frenteServicoOutro).toUpperCase();
  const motivo = getValue(data.motivo, data.motivoOutro).toUpperCase();
  const duracao = getValue(data.duracao, data.duracaoPersonalizada);

  const substituidoQuadro = getValue(data.substituidoQuadro, data.substituidoQuadroOutro).toUpperCase();
  const substitutoQuadro = getValue(data.substitutoQuadro, data.substitutoQuadroOutro).toUpperCase();
  const superiorQuadro = getValue(data.superiorQuadro, data.superiorQuadroOutro).toUpperCase();

  // Calculate periods
  const { endDateStr: calcEndDate, endTimeStr: calcEndTime } = calculateEndDateTime(data.dataServico, data.horaInicio, data.duracao);
  const finalEndDate = data.duracao === 'Personalizado' ? data.dataServico : calcEndDate;
  const finalEndTime = data.duracao === 'Personalizado' ? data.horaTermino : calcEndTime;
  const periodoServico = formatPeriodText(data.dataServico, data.horaInicio, finalEndDate, finalEndTime);

  let reposicaoTextBlocks: {text: string, bold: boolean}[] = [];
  if (data.dataReposicao) {
    const { endDateStr: repEndDate, endTimeStr: repEndTime } = calculateEndDateTime(data.dataReposicao, data.horaInicio, data.duracao);
    const finalRepEndDate = data.duracao === 'Personalizado' ? data.dataReposicao : repEndDate;
    const finalRepEndTime = data.duracao === 'Personalizado' ? data.horaTermino : repEndTime;
    const periodoReposicao = formatPeriodText(data.dataReposicao, data.horaInicio, finalRepEndDate, finalRepEndTime);
    reposicaoTextBlocks = [{ text: ` Informo que a reposição ocorrerá ${periodoReposicao}.`, bold: false }];
  }

  // --- Header ---
  doc.setFont('times', 'bold');
  
  try {
    const response = await fetch('/logotipo.png');
    if (response.ok) {
      const blob = await response.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(logoBase64, 'PNG', 95, 10, 20, 25);
    }
  } catch (e) {
    console.warn('Logo not found at /logotipo.png');
  }
  
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text('ESTADO DO TOCANTINS', 105, 45, { align: 'center' });
  doc.text('POLÍCIA MILITAR', 105, 51, { align: 'center' });
  doc.text(grandeComando, 105, 57, { align: 'center' });
  doc.text(unidade, 105, 63, { align: 'center' });
  doc.text(subunidade, 105, 69, { align: 'center' });

  // --- Title ---
  doc.setFont('times', 'normal');
  const title = 'TROCA DE SERVIÇO';
  doc.text(title, 105, 85, { align: 'center' });
  const titleWidth = doc.getTextWidth(title);
  doc.line(105 - titleWidth / 2, 86, 105 + titleWidth / 2, 86); // Underline exactly under text

  // --- Right Block (Visto em) ---
  doc.text('Visto em', 170, 100, { align: 'center' });
  doc.text('____/____/_______', 170, 110, { align: 'center' });
  doc.text('________________', 170, 120, { align: 'center' });
  
  // Split the superior function to fit if it's too long
  const funcLines = doc.splitTextToSize(data.superiorFuncao, 50);
  doc.text(funcLines, 170, 126, { align: 'center' });

  // --- Body ---
  // Do: **SD QPPM LEANDRO**
  const doText = data.substituidoSexo === 'F' ? 'Da: ' : 'Do: ';
  doc.setFont('times', 'normal');
  doc.text(doText, 20, 140);
  const doWidth = doc.getTextWidth(doText);
  doc.setFont('times', 'bold');
  doc.text(`${data.substituidoGraduacao} ${substituidoQuadro} ${data.substituidoNome.toUpperCase()}`, 20 + doWidth, 140);

  // Ao Sr. **2º TEN QOA INÁCIO**
  const aoText = data.superiorSexo === 'F' ? 'À Sra. ' : 'Ao Sr. ';
  doc.setFont('times', 'normal');
  doc.text(aoText, 20, 150);
  const aoWidth = doc.getTextWidth(aoText);
  doc.setFont('times', 'bold');
  doc.text(`${data.superiorGraduacao} ${superiorQuadro} ${data.superiorNome.toUpperCase()}`, 20 + aoWidth, 150);

  // COMANDANTE DO 1º PELOTÃO OPERACIONAL DA 8ª CIPM.
  doc.setFont('times', 'normal');
  doc.text(`${data.superiorFuncao.toUpperCase()} DA ${unidade}.`, 20, 160);

  doc.text('Assunto: Solicitação de Troca de Serviço.', 20, 175);

  const substitutoNomeCompleto = `${data.substitutoGraduacao} ${substitutoQuadro} ${data.substitutoNome.toUpperCase()}`;
  const comOText = data.substitutoSexo === 'F' ? 'com a ' : 'com o ';

  const bodyBlocks = [
    { text: `    Solicito troca de serviço de ${frenteServico}, ${comOText}`, bold: false },
    { text: substitutoNomeCompleto, bold: true },
    { text: `, serviço de ${duracao} (${periodoServico}).`, bold: false },
    ...reposicaoTextBlocks
  ];

  renderRichText(doc, bodyBlocks, 20, 190, 170, 6, true);

  doc.text('Motivo da Troca de Serviço:', 20, 215);
  doc.text(motivo, 20, 223);

  // --- Signatures ---
  doc.text('_______________________', 60, 260, { align: 'center' });
  doc.text('Substituído', 60, 266, { align: 'center' });

  doc.text('_______________________', 150, 260, { align: 'center' });
  doc.text('Substituto', 150, 266, { align: 'center' });

  // Save the PDF
  doc.save('troca_de_servico.pdf');
};
