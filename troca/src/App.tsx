/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Form from './components/Form';
import { Shield, ArrowLeft } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      <a 
        href="../index.html" 
        className="absolute top-4 left-4 sm:top-8 sm:left-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        P8 - Início
      </a>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 mt-8 sm:mt-0">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Shield className="w-10 h-10 text-indigo-700" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Gerador de Troca de Serviço PM
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Preencha o formulário abaixo para gerar o documento oficial de solicitação de troca de serviço.
          </p>
        </div>
        
        <Form />
        
        <footer className="mt-12 text-center text-sm text-gray-400">
          <p>Este sistema gera documentos baseados no modelo oficial da Polícia Militar.</p>
          <p className="mt-1">Os dados não são salvos em nenhum servidor, o processamento ocorre localmente no seu navegador.</p>
        </footer>
      </div>
    </div>
  );
}
