// src/components/ChallengeCreate.jsx - Atualizado com regras
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faDumbbell, 
  faRunning, 
  faBookOpen, 
  faWalking, 
  faMoneyBillWave,
  faChevronLeft,
  faChevronRight,
  faSave
} from "@fortawesome/free-solid-svg-icons";
import ChallengeRulesForm from "./ChallengeRulesForm";

const ChallengeCreate = ({ user }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    modality: "",
    target: "",
    start_date: "",
    duration_days: 30,
    bet: "",
    private: true,
  });
  
  const [rules, setRules] = useState(null);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (formData.start_date && formData.duration_days) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + parseInt(formData.duration_days) - 1);
      setFormData({
        ...formData,
        end_date: endDate.toISOString().split("T")[0],
      });
    }
  }, [formData.start_date, formData.duration_days]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleRulesChange = (newRules) => {
    setRules(newRules);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const payload = {
      ...formData,
      target: parseInt(formData.target),
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
    };
    
    try {
      // Criar o desafio
      const res = await fetch(`${API_URL}/challenges/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        const challengeData = await res.json();
        
        // Criar as regras se disponíveis
        if (rules && challengeData.id) {
          try {
            await fetch(`${API_URL}/challenges/${challengeData.id}/rules`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`,
              },
              body: JSON.stringify(rules),
            });
          } catch (rulesError) {
            console.error("Erro ao criar regras:", rulesError);
          }
        }
        
        navigate(`/challenge/${challengeData.id}/dashboard`);
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Erro ao criar desafio");
      }
    } catch (error) {
      console.error(error);
      alert("Erro na criação do desafio");
    }
  };

  const modalityTemplates = [
    {
      icon: faDumbbell,
      name: "academia",
      label: "Academia",
      target: 12,
      description: "Desafio para frequentar a academia regularmente.",
    },
    {
      icon: faRunning,
      name: "corrida",
      label: "Corrida",
      target: 30,
      description: "Desafio para correr uma certa distância ou frequência.",
    },
    {
      icon: faWalking,
      name: "passos",
      label: "Passos",
      target: 10000,
      description: "Desafio para atingir um número mínimo de passos diários.",
    },
    {
      icon: faBookOpen,
      name: "leitura",
      label: "Leitura",
      target: 20,
      description: "Desafio para ler uma quantidade de páginas ou livros.",
    },
    {
      icon: faMoneyBillWave,
      name: "investimento",
      label: "Economia/Investimento",
      target: 500,
      description: "Desafio para economizar ou investir uma quantia específica.",
    },
  ];

  const selectModalityTemplate = (template) => {
    setFormData({
      ...formData,
      modality: template.name,
      target: template.target,
      description: template.description,
    });
    setActiveStep(2);
  };

  // Formatação da data atual para o valor mínimo dos campos de data
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Criar Novo Desafio</h1>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className={activeStep >= 1 ? "font-bold text-green-500" : ""}>Tipo</span>
          <span className={activeStep >= 2 ? "font-bold text-green-500" : ""}>Detalhes</span>
          <span className={activeStep >= 3 ? "font-bold text-green-500" : ""}>Regras</span>
          <span className={activeStep >= 4 ? "font-bold text-green-500" : ""}>Confirmar</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${(activeStep / 4) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {activeStep === 1 && (
        <>
          <h2 className="text-xl font-bold mb-4">Escolha o tipo de desafio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {modalityTemplates.map((template) => (
              <div 
                key={template.name}
                onClick={() => selectModalityTemplate(template)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center mb-2">
                  <div className="bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 p-3 rounded-full mr-3">
                    <FontAwesomeIcon icon={template.icon} className="text-blue-500" />
                  </div>
                  <h3 className="font-bold">{template.label}</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
              </div>
            ))}
            <div 
              onClick={() => {
                setFormData({
                  ...formData,
                  modality: "personalizado",
                });
                setActiveStep(2);
              }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center"
            >
              <span className="font-bold">Criar desafio personalizado</span>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={() => navigate("/challenges")}
              className="px-4 py-2 border rounded dark:border-gray-600 dark:text-gray-300"
            >
              Cancelar
            </button>
          </div>
        </>
      )}
      
      {activeStep === 2 && (
        <>
          <h2 className="text-xl font-bold mb-4">Defina os detalhes do desafio</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Título</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Ex: 30 dias de academia"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Descreva seu desafio"
                rows="3"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Meta (quantidade)</label>
                <input
                  type="number"
                  name="target"
                  value={formData.target}
                  onChange={handleChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Ex: 30"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Duração (dias)</label>
                <input
                  type="number"
                  name="duration_days"
                  value={formData.duration_days}
                  onChange={handleChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Data de início</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                min={today}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Regras / Aposta</label>
              <textarea
                name="bet"
                value={formData.bet}
                onChange={handleChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Opcional: defina regras ou apostas para este desafio"
                rows="3"
              ></textarea>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="private"
                checked={formData.private}
                onChange={handleChange}
                id="private"
                className="mr-2"
              />
              <label htmlFor="private" className="text-gray-700 dark:text-gray-300">
                Desafio privado (somente para convidados)
              </label>
            </div>
            
            <div className="flex justify-between pt-4">
              <button 
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 border rounded dark:border-gray-600 flex items-center"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                Voltar
              </button>
              <button 
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 bg-green-500 text-white rounded flex items-center"
              >
                Próximo
                <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
              </button>
            </div>
          </form>
        </>
      )}

      {activeStep === 3 && (
        <>
          <h2 className="text-xl font-bold mb-4">Defina as regras de pontuação</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Configure como os participantes ganharão pontos neste desafio. Estas regras ajudarão a determinar os rankings e o progresso.
          </p>
          
          <ChallengeRulesForm 
            modality={formData.modality} 
            onChange={handleRulesChange}
          />
          
          <div className="flex justify-between pt-4">
            <button 
              type="button"
              onClick={() => setActiveStep(2)}
              className="px-4 py-2 border rounded dark:border-gray-600 flex items-center"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
              Voltar
            </button>
            <button 
              type="button"
              onClick={() => setActiveStep(4)}
              className="px-4 py-2 bg-green-500 text-white rounded flex items-center"
            >
              Próximo
              <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
            </button>
          </div>
        </>
      )}
      
      {activeStep === 4 && (
        <>
          <h2 className="text-xl font-bold mb-4">Confirme os detalhes do desafio</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h3 className="text-xl font-bold mb-2">{formData.title || "Sem título"}</h3>
            <p className="mb-4">{formData.description || "Sem descrição"}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Modalidade</p>
                <p className="font-semibold">{formData.modality}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Meta</p>
                <p className="font-semibold">{formData.target}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Início</p>
                <p className="font-semibold">{formData.start_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duração</p>
                <p className="font-semibold">{formData.duration_days} dias</p>
              </div>
            </div>
            
            {rules && (
              <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 p-3 rounded-lg mb-4">
                <p className="font-medium mb-1">Regras de Pontuação:</p>
                <p className="text-sm">
                  Mínimo de {rules.min_threshold} {rules.unit_name} para ganhar {rules.min_points} pontos.
                  Cada {rules.additional_unit} {rules.unit_name} adicional vale mais {rules.additional_points} pontos.
                </p>
              </div>
            )}
            
            {formData.bet && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Regras / Aposta</p>
                <p className="font-semibold">{formData.bet}</p>
              </div>
            )}
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Visibilidade: {formData.private ? "Privado" : "Público"}
            </p>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={() => setActiveStep(3)}
              className="px-4 py-2 border rounded dark:border-gray-600 flex items-center"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
              Voltar
            </button>
            <button 
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-500 text-white rounded flex items-center"
            >
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              Criar Desafio
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChallengeCreate;