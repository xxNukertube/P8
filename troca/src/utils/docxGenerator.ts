import { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { TrocaServicoData } from '../types';
import { calculateEndDateTime, formatPeriodText } from './dateUtils';

export const generateDOCX = async (data: TrocaServicoData) => {
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

  const { endDateStr: calcEndDate, endTimeStr: calcEndTime } = calculateEndDateTime(data.dataServico, data.horaInicio, data.duracao);
  const finalEndDate = data.duracao === 'Personalizado' ? data.dataServico : calcEndDate;
  const finalEndTime = data.duracao === 'Personalizado' ? data.horaTermino : calcEndTime;
  const periodoServico = formatPeriodText(data.dataServico, data.horaInicio, finalEndDate, finalEndTime);

  let reposicaoRuns: TextRun[] = [];
  if (data.dataReposicao) {
    const { endDateStr: repEndDate, endTimeStr: repEndTime } = calculateEndDateTime(data.dataReposicao, data.horaInicio, data.duracao);
    const finalRepEndDate = data.duracao === 'Personalizado' ? data.dataReposicao : repEndDate;
    const finalRepEndTime = data.duracao === 'Personalizado' ? data.horaTermino : repEndTime;
    const periodoReposicao = formatPeriodText(data.dataReposicao, data.horaInicio, finalRepEndDate, finalRepEndTime);
    reposicaoRuns = [new TextRun({ text: ` Informo que a reposição ocorrerá ${periodoReposicao}.`, size: 24, font: "Times New Roman" })];
  }

  const substitutoNomeCompleto = `${data.substitutoGraduacao} ${substitutoQuadro} ${data.substitutoNome.toUpperCase()}`;

  const children: any[] = [];

  try {
    const response = await fetch('/logotipo.png');
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('image')) {
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        const base64Data = base64.split(',')[1];
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 240, lineRule: "auto" },
            children: [
              new ImageRun({
                data: bytes,
                transformation: {
                  width: 80,
                  height: 100,
                },
              }),
            ],
          })
        );
      }
    }
  } catch (e) {
    console.warn('Logo not found at /logotipo.png');
  }

  const createParagraph = (options: any) => {
    return new Paragraph({
      ...options,
      spacing: { line: 240, lineRule: "auto", ...options.spacing },
    });
  };

  children.push(
    createParagraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "ESTADO DO TOCANTINS", bold: true, size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "POLÍCIA MILITAR", bold: true, size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `${grandeComando}`, bold: true, size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `${unidade}`, bold: true, size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `${subunidade}`, bold: true, size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({ text: "" }),
    createParagraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "TROCA DE SERVIÇO", underline: {}, size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({ text: "" }),
    createParagraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "Visto em ____/____/_______", size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "_______________________", size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: `${data.superiorFuncao}`, size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({ text: "" }),
    createParagraph({ text: "" }),
    createParagraph({
      children: [
        new TextRun({ text: data.substituidoSexo === 'F' ? "Da: " : "Do: ", size: 24, font: "Times New Roman" }),
        new TextRun({ text: `${data.substituidoGraduacao} ${substituidoQuadro} ${data.substituidoNome.toUpperCase()}`, bold: true, size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({
      children: [
        new TextRun({ text: data.superiorSexo === 'F' ? "À Sra. " : "Ao Sr. ", size: 24, font: "Times New Roman" }),
        new TextRun({ text: `${data.superiorGraduacao} ${superiorQuadro} ${data.superiorNome.toUpperCase()}`, bold: true, size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({
      children: [
        new TextRun({ text: `${data.superiorFuncao.toUpperCase()} DA ${unidade}.`, size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({ text: "" }),
    createParagraph({
      children: [
        new TextRun({ text: "Assunto: Solicitação de Troca de Serviço.", size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({ text: "" }),
    createParagraph({
      alignment: AlignmentType.JUSTIFIED,
      children: [
        new TextRun({ text: `    Solicito troca de serviço de ${frenteServico}, ${data.substitutoSexo === 'F' ? 'com a ' : 'com o '}`, size: 24, font: "Times New Roman" }),
        new TextRun({ text: substitutoNomeCompleto, bold: true, size: 24, font: "Times New Roman" }),
        new TextRun({ text: `, serviço de ${duracao} (${periodoServico}).`, size: 24, font: "Times New Roman" }),
        ...reposicaoRuns
      ],
    }),
    createParagraph({ text: "" }),
    createParagraph({
      children: [
        new TextRun({ text: "Motivo da Troca de Serviço:", size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({
      children: [
        new TextRun({ text: `${motivo}`, size: 24, font: "Times New Roman" }),
      ],
    }),
    createParagraph({ text: "" }),
    createParagraph({ text: "" }),
    createParagraph({ text: "" }),
    new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                createParagraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "_______________________", size: 24, font: "Times New Roman" }),
                  ],
                }),
                createParagraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "Substituído", size: 24, font: "Times New Roman" }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                createParagraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "_______________________", size: 24, font: "Times New Roman" }),
                  ],
                }),
                createParagraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "Substituto", size: 24, font: "Times New Roman" }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1701, // 3cm
            right: 1134, // 2cm
            bottom: 1134, // 2cm
            left: 1701, // 3cm
          },
        },
      },
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'troca_de_servico.docx');
};
