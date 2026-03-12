import React, { useState, useEffect } from 'react';
import { FileText, Download, FileDown } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { generateDOCX } from '../utils/docxGenerator';
import { calculateEndDateTime } from '../utils/dateUtils';
import { TrocaServicoData } from '../types';

const GRANDE_COMANDOS = ['CPC', 'CPE', 'CRP-1', 'CRP-2', 'CRP-3', 'Outro'];

const UNIDADES_POR_COMANDO: Record<string, string[]> = {
  'CPC': ['1º BPM', '6º BPM', '13º BPM', '1ª CIPM'],
  'CPE': ['BPMA', 'BPCHOQUE', 'BPMRED', 'GRAER', 'BOPE', 'RPMON'],
  'CRP-1': ['3º BPM', '5º BPM', '7º BPM', '8º BPM', '4ª CIPM', '6ª CIPM'],
  'CRP-2': ['2º BPM', '9º BPM', '14º BPM', '2ª CIPM', '3ª CIPM', '5ª CIPM'],
  'CRP-3': ['4º BPM', '10º BPM', '11º BPM', '12º BPM', '7ª CIPM', '8ª CIPM'],
};

const SUBUNIDADES_BPM = ['1ª CIA', '2ª CIA', '3ª CIA', '4ª CIA', '5ª CIA', 'Outro'];
const SUBUNIDADES_CIPM = ['1º Pel', '2º Pel', '3º Pel', '4º Pel', '5º Pel', 'Outro'];

const FRENTES_SERVICO = ['RP', 'Reserva', 'SPO', 'PE', 'ACO', 'CPU', 'Fiscal de Dia', 'Outro'];
const MOTIVOS = ['Particular', 'Saúde', 'Escolar', 'Outro'];

const GRADUACOES = ['SD', 'CB', '3º SGT', '2º SGT', '1º SGT', 'SUB TEN', '2º TEN', '1º TEN', 'CAP', 'MAJ', 'TEN CEL', 'CEL'];
const QUADROS_PRACAS = ['QPPM', 'QPS', 'QPE', 'Outro'];
const QUADROS_OFICIAIS = ['QOPM', 'QOA', 'QOAPM', 'QOS', 'QOE', 'QOM', 'Outro'];
const DURACAO = ['6h', '12h', '24h', '48h', 'Personalizado'];

const getQuadrosForGraduacao = (graduacao: string) => {
  const pracas = ['SD', 'CB', '3º SGT', '2º SGT', '1º SGT', 'SUB TEN'];
  return pracas.includes(graduacao) ? QUADROS_PRACAS : QUADROS_OFICIAIS;
};

const initialState: TrocaServicoData = {
  grandeComando: 'CPC',
  grandeComandoOutro: '',
  unidade: '1º BPM',
  unidadeOutro: '',
  subunidade: '1ª CIA',
  subunidadeOutro: '',
  frenteServico: 'RP',
  frenteServicoOutro: '',
  motivo: 'Particular',
  motivoOutro: '',

  substituidoRg: '',
  substituidoSexo: 'M',
  substituidoGraduacao: 'SD',
  substituidoQuadro: 'QPPM',
  substituidoQuadroOutro: '',
  substituidoNome: '',

  substitutoRg: '',
  substitutoSexo: 'M',
  substitutoGraduacao: 'SD',
  substitutoQuadro: 'QPPM',
  substitutoQuadroOutro: '',
  substitutoNome: '',

  superiorSexo: 'M',
  superiorGraduacao: '2º TEN',
  superiorQuadro: 'QOAPM',
  superiorQuadroOutro: '',
  superiorNome: '',
  superiorFuncao: 'Comandante do 1º Pelotão Operacional',

  dataServico: '',
  dataReposicao: '',

  duracao: '48h',
  duracaoPersonalizada: '',
  horaInicio: '08:00',
  dataTermino: '',
  horaTermino: '08:00',
};

export default function Form() {
  const [formData, setFormData] = useState<TrocaServicoData>(initialState);
  const [unidadesOptions, setUnidadesOptions] = useState<string[]>(UNIDADES_POR_COMANDO['CPC']);
  const [subunidadesOptions, setSubunidadesOptions] = useState<string[]>(SUBUNIDADES_BPM);

  useEffect(() => {
    if (formData.grandeComando !== 'Outro') {
      const options = UNIDADES_POR_COMANDO[formData.grandeComando] || [];
      setUnidadesOptions(options);
      if (options.length > 0 && !options.includes(formData.unidade)) {
        setFormData(prev => ({ ...prev, unidade: options[0] }));
      }
    } else {
      setUnidadesOptions(['Outro']);
      setFormData(prev => ({ ...prev, unidade: 'Outro' }));
    }
  }, [formData.grandeComando]);

  useEffect(() => {
    const isBPM = formData.unidade.includes('BPM') || formData.unidade === 'Outro';
    const options = isBPM ? SUBUNIDADES_BPM : SUBUNIDADES_CIPM;
    setSubunidadesOptions(options);
    if (!options.includes(formData.subunidade)) {
      setFormData(prev => ({ ...prev, subunidade: options[0] }));
    }
  }, [formData.unidade]);

  useEffect(() => {
    if (formData.duracao === 'Personalizado') {
      setFormData(prev => ({ ...prev, horaTermino: '', dataTermino: '' }));
      return;
    }

    const { endDateStr, endTimeStr } = calculateEndDateTime(formData.dataServico, formData.horaInicio, formData.duracao);
    
    setFormData(prev => ({ ...prev, horaTermino: endTimeStr, dataTermino: endDateStr }));
  }, [formData.duracao, formData.horaInicio, formData.dataServico]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name.endsWith('Graduacao')) {
        const prefix = name.replace('Graduacao', ''); // substituido, substituto, superior
        const novoQuadroList = getQuadrosForGraduacao(value);
        const currentQuadro = prev[`${prefix}Quadro` as keyof TrocaServicoData] as string;
        
        if (!novoQuadroList.includes(currentQuadro)) {
          newData[`${prefix}Quadro` as keyof TrocaServicoData] = novoQuadroList[0] as any;
        }
      }
      
      return newData;
    });
  };

  const handleGeneratePDF = (e: React.FormEvent) => {
    e.preventDefault();
    generatePDF(formData);
  };

  const handleGenerateDOCX = (e: React.FormEvent) => {
    e.preventDefault();
    generateDOCX(formData);
  };

  const renderSelectOrInput = (
    label: string,
    name: string,
    options: string[],
    outroName: string,
    required = true
  ) => {
    const isOutro = formData[name as keyof TrocaServicoData] === 'Outro';
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <select
          name={name}
          value={formData[name as keyof TrocaServicoData] as string}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
          required={required}
        >
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {isOutro && (
          <input
            type="text"
            name={outroName}
            value={formData[outroName as keyof TrocaServicoData] as string}
            onChange={handleChange}
            placeholder="Especifique"
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            required={required}
          />
        )}
      </div>
    );
  };

  return (
    <form className="space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100">
      
      {/* SECTION 1: CABEÇALHO */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            1. Identificação da Unidade
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderSelectOrInput('Grande Comando', 'grandeComando', GRANDE_COMANDOS, 'grandeComandoOutro')}
          {renderSelectOrInput('Unidade', 'unidade', unidadesOptions, 'unidadeOutro')}
          {renderSelectOrInput('Subunidade', 'subunidade', subunidadesOptions, 'subunidadeOutro')}
        </div>
      </div>

      {/* SECTION 2: SERVIÇO */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">2. Dados do Serviço</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderSelectOrInput('Frente de Serviço', 'frenteServico', FRENTES_SERVICO, 'frenteServicoOutro')}
          {renderSelectOrInput('Motivo da Troca', 'motivo', MOTIVOS, 'motivoOutro')}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Data do Serviço Solicitado</label>
            <input
              type="date"
              name="dataServico"
              value={formData.dataServico}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Data da Reposição (Opcional)</label>
            <input
              type="date"
              name="dataReposicao"
              value={formData.dataReposicao}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            />
          </div>

          {renderSelectOrInput('Duração da Troca', 'duracao', DURACAO, 'duracaoPersonalizada')}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Hora de Início</label>
            <input
              type="time"
              name="horaInicio"
              value={formData.horaInicio}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              required
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: ENVOLVIDOS */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">3. Dados dos Militares</h2>
        </div>
        
        {/* SUBSTITUÍDO */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <h3 className="font-medium text-gray-900">Militar Substituído</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Sexo</label>
              <select name="substituidoSexo" value={formData.substituidoSexo} onChange={handleChange} className="w-full p-2 border rounded-md text-sm bg-white">
                <option value="M">M (Masc)</option>
                <option value="F">F (Fem)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Graduação/Posto</label>
              <select name="substituidoGraduacao" value={formData.substituidoGraduacao} onChange={handleChange} className="w-full p-2 border rounded-md text-sm bg-white">
                {GRADUACOES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            {renderSelectOrInput('Quadro', 'substituidoQuadro', getQuadrosForGraduacao(formData.substituidoGraduacao), 'substituidoQuadroOutro')}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700">Nome de Guerra</label>
              <input type="text" name="substituidoNome" value={formData.substituidoNome} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" required />
            </div>
          </div>
        </div>

        {/* SUBSTITUTO */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <h3 className="font-medium text-gray-900">Militar Substituto</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Sexo</label>
              <select name="substitutoSexo" value={formData.substitutoSexo} onChange={handleChange} className="w-full p-2 border rounded-md text-sm bg-white">
                <option value="M">M (Masc)</option>
                <option value="F">F (Fem)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Graduação/Posto</label>
              <select name="substitutoGraduacao" value={formData.substitutoGraduacao} onChange={handleChange} className="w-full p-2 border rounded-md text-sm bg-white">
                {GRADUACOES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            {renderSelectOrInput('Quadro', 'substitutoQuadro', getQuadrosForGraduacao(formData.substitutoGraduacao), 'substitutoQuadroOutro')}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700">Nome de Guerra</label>
              <input type="text" name="substitutoNome" value={formData.substitutoNome} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" required />
            </div>
          </div>
        </div>

        {/* SUPERIOR */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
          <h3 className="font-medium text-gray-900">Superior Imediato (Destinatário)</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Sexo</label>
              <select name="superiorSexo" value={formData.superiorSexo} onChange={handleChange} className="w-full p-2 border rounded-md text-sm bg-white">
                <option value="M">M (Masc)</option>
                <option value="F">F (Fem)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Graduação/Posto</label>
              <select name="superiorGraduacao" value={formData.superiorGraduacao} onChange={handleChange} className="w-full p-2 border rounded-md text-sm bg-white">
                {GRADUACOES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            {renderSelectOrInput('Quadro', 'superiorQuadro', getQuadrosForGraduacao(formData.superiorGraduacao), 'superiorQuadroOutro')}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-medium text-gray-700">Nome</label>
              <input type="text" name="superiorNome" value={formData.superiorNome} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" required />
            </div>
            <div className="space-y-2 md:col-span-4">
              <label className="block text-xs font-medium text-gray-700">Função (Ex: Comandante do 1º Pelotão Operacional)</label>
              <input type="text" name="superiorFuncao" value={formData.superiorFuncao} onChange={handleChange} className="w-full p-2 border rounded-md text-sm" required />
            </div>
          </div>
        </div>

      </div>

      {/* ACTIONS */}
      <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-end">
        <button
          type="button"
          onClick={handleGenerateDOCX}
          className="inline-flex justify-center items-center py-2.5 px-6 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <FileDown className="w-4 h-4 mr-2" />
          Exportar DOCX
        </button>
        <button
          type="button"
          onClick={handleGeneratePDF}
          className="inline-flex justify-center items-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Gerar PDF
        </button>
      </div>
    </form>
  );
}
