// ChallengeRulesForm.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const ChallengeRulesForm = ({ modality, onChange, initialValues }) => {
  // Configurações padrão baseadas na modalidade
  const getDefaultConfig = (modality) => {
    switch(modality) {
      case 'academia':
        return { 
          min_threshold: 3, 
          min_points: 10, 
          additional_unit: 1, 
          additional_points: 3,
          unit_name: 'treinos',
          period: 'semana'
        };
      case 'leitura':
        return { 
          min_threshold: 90, 
          min_points: 15, 
          additional_unit: 30, 
          additional_points: 5,
          unit_name: 'páginas',
          period: 'semana'
        };
      case 'corrida':
        return { 
          min_threshold: 15, 
          min_points: 20, 
          additional_unit: 5, 
          additional_points: 5,
          unit_name: 'km',
          period: 'semana'
        };
      case 'investimento':
        return { 
          min_threshold: 200, 
          min_points: 10, 
          additional_unit: 100, 
          additional_points: 2,
          unit_name: 'reais',
          period: 'mês'
        };
      default:
        return { 
          min_threshold: 3, 
          min_points: 10, 
          additional_unit: 1, 
          additional_points: 3,
          unit_name: 'unidades',
          period: 'semana'
        };
    }
  };

  // Estado inicial baseado na modalidade ou valores iniciais
  const [rules, setRules] = useState(
    initialValues || getDefaultConfig(modality)
  );

  // Atualiza quando a modalidade muda
  useEffect(() => {
    if (!initialValues) {
      setRules(getDefaultConfig(modality));
    }
  }, [modality, initialValues]);

  // Notifica o componente pai sobre mudanças
  useEffect(() => {
    if (onChange) {
      onChange(rules);
    }
  }, [rules, onChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRules({
      ...rules,
      [name]: parseInt(value) || 0
    });
  };

  const handleUnitNameChange = (e) => {
    setRules({
      ...rules,
      unit_name: e.target.value
    });
  };

  const handlePeriodChange = (e) => {
    setRules({
      ...rules,
      period: e.target.value
    });
  };

  // Retorna mensagem descritiva das regras
  const getRuleDescription = () => {
    return `Se você completar pelo menos ${rules.min_threshold} ${rules.unit_name} por ${rules.period}, 
    você ganhará ${rules.min_points} pontos. Cada ${rules.additional_unit} ${rules.unit_name} adicional 
    vale mais ${rules.additional_points} pontos.`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Regras de Pontuação</h3>
        <div className="relative group">
          <FontAwesomeIcon 
            icon={faInfoCircle} 
            className="text-blue-500 cursor-help"
          />
          <div className="absolute right-0 bg-blue-100 dark:bg-blue-900 p-2 rounded shadow text-sm w-64 invisible group-hover:visible z-10">
            Configure como os participantes ganharão pontos neste desafio.
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Unidade de medida
          </label>
          <input
            type="text"
            value={rules.unit_name}
            onChange={handleUnitNameChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            placeholder="treinos, páginas, km..."
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Período
          </label>
          <select
            value={rules.period}
            onChange={handlePeriodChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="semana">Semanal</option>
            <option value="mês">Mensal</option>
            <option value="desafio">Todo o Desafio</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mínimo para pontuação base
          </label>
          <input
            type="number"
            name="min_threshold"
            value={rules.min_threshold}
            onChange={handleChange}
            min="1"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pontos base
          </label>
          <input
            type="number"
            name="min_points"
            value={rules.min_points}
            onChange={handleChange}
            min="0"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Unidades adicionais
          </label>
          <input
            type="number"
            name="additional_unit"
            value={rules.additional_unit}
            onChange={handleChange}
            min="1"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pontos por unidade adicional
          </label>
          <input
            type="number"
            name="additional_points"
            value={rules.additional_points}
            onChange={handleChange}
            min="0"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>
      
      <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 p-3 rounded-lg">
        <p className="text-sm text-green-800 dark:text-green-200">
          <strong>Resumo:</strong> {getRuleDescription()}
        </p>
      </div>
    </div>
  );
};

export default ChallengeRulesForm;