export interface TrocaServicoData {
  grandeComando: string;
  grandeComandoOutro: string;
  unidade: string;
  unidadeOutro: string;
  subunidade: string;
  subunidadeOutro: string;
  frenteServico: string;
  frenteServicoOutro: string;
  motivo: string;
  motivoOutro: string;

  substituidoRg: string;
  substituidoSexo: 'M' | 'F';
  substituidoGraduacao: string;
  substituidoQuadro: string;
  substituidoQuadroOutro: string;
  substituidoNome: string;

  substitutoRg: string;
  substitutoSexo: 'M' | 'F';
  substitutoGraduacao: string;
  substitutoQuadro: string;
  substitutoQuadroOutro: string;
  substitutoNome: string;

  superiorSexo: 'M' | 'F';
  superiorGraduacao: string;
  superiorQuadro: string;
  superiorQuadroOutro: string;
  superiorNome: string;
  superiorFuncao: string;

  dataServico: string;
  dataReposicao: string;

  duracao: string;
  duracaoPersonalizada: string;
  horaInicio: string;
  dataTermino: string;
  horaTermino: string;
}
