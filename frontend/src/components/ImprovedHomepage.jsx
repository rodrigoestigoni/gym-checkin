// ImprovedHomepage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faFire, 
  faTrophy, 
  faShare, 
  faSearch,
  faUserPlus,
  faExclamationTriangle,
  faCheckCircle,
  faCopy
} from '@fortawesome/free-solid-svg-icons';

const ImprovedHomepage = ({ user }) => {
  // Estados principais
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [myCreatedChallenges, setMyCreatedChallenges] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados auxiliares
  const [searchCode, setSearchCode] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  
  // Refs para evitar loops
  const effectRan = useRef(false);
  const fetchInProgress = useRef(false);
  
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  // Função para buscar todos os dados necessários de uma vez
  // Usando useEffect com controle para evitar múltiplas chamadas
  useEffect(() => {
    // Prevenir execuções repetidas 
    if (effectRan.current || fetchInProgress.current) return;
    if (!user?.token) return;
    
    fetchInProgress.current = true;
    
    const controller = new AbortController();
    let isMounted = true;
    
    const fetchAllData = async () => {
      try {
        setLoading(true);
        console.log("Iniciando busca de dados para a homepage");
        
        // Buscar em paralelo para melhor performance
        const [participationRes, challengesRes, invitationsRes] = await Promise.all([
          // Participação em desafios (onde o usuário é participante)
          fetch(`${API_URL}/challenge-participation/`, {
            headers: { 
              Authorization: `Bearer ${user.token}`,
              "Cache-Control": "no-cache" 
            },
            signal: controller.signal
          }),
          
          // Desafios criados pelo usuário
          fetch(`${API_URL}/challenges/`, {
            headers: { 
              Authorization: `Bearer ${user.token}`,
              "Cache-Control": "no-cache"
            },
            signal: controller.signal
          }),
          
          // Convites pendentes
          fetch(`${API_URL}/challenge-invitations/`, {
            headers: { 
              Authorization: `Bearer ${user.token}`,
              "Cache-Control": "no-cache"
            },
            signal: controller.signal
          })
        ]);
        
        // Verificar se o componente ainda está montado
        if (!isMounted) return;
        
        // Processar participações
        if (participationRes.ok) {
          const data = await participationRes.json();
          
          // Filtrar apenas desafios ativos com participação aprovada
          const now = new Date();
          const activeOnes = data.filter(item => {
            const startDate = new Date(item.challenge.start_date);
            const endDate = new Date(item.challenge.end_date);
            return now >= startDate && now <= endDate && item.participant.approved;
          });
          
          // Filtrar desafios pendentes
          const pendingOnes = data.filter(item => {
            return !item.participant.approved;
          });
          
          if (isMounted) {
            setActiveChallenges(activeOnes);
          }
        }
        
        // Processar desafios criados pelo usuário
        if (challengesRes.ok) {
          const data = await challengesRes.json();
          if (isMounted) {
            setMyCreatedChallenges(data);
          }
        }
        
        // Processar convites pendentes
        if (invitationsRes.ok) {
          const data = await invitationsRes.json();
          if (isMounted) {
            setPendingInvitations(data);
          }
        }
        
        if (isMounted) {
          setLoading(false);
          // Marcar que o efeito já foi executado
          effectRan.current = true;
        }
      } catch (err) {
        // Ignorar erros de abortamento
        if (err.name === 'AbortError') return;
        
        console.error("Error fetching data:", err);
        if (isMounted) {
          setError("Erro ao carregar dados. Por favor, tente novamente.");
          setLoading(false);
          effectRan.current = true;
        }
      } finally {
        fetchInProgress.current = false;
      }
    };
    
    fetchAllData();
    
    // Função de limpeza
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user?.token, API_URL]);

  // Handler para buscar desafio pelo código
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    
    setSearchError("");
    setSearchResult(null);
    
    try {
      const res = await fetch(`${API_URL}/challenges/invite/${searchCode.trim()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setSearchResult(data);
      } else {
        const errData = await res.json();
        setSearchError(errData.detail || "Desafio não encontrado");
      }
    } catch (err) {
      console.error(err);
      setSearchError("Erro na requisição");
    }
  };

  // Handler para participar de um desafio
  const handleJoinChallenge = async (challengeId) => {
    try {
      const res = await fetch(`${API_URL}/challenges/${challengeId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      if (res.ok) {
        alert("Solicitação enviada! Aguardando aprovação.");
        
        // Atualizar UI - adicionar aos pendentes
        setSearchResult(prev => {
          if (prev && prev.id === challengeId) {
            return { ...prev, requested: true };
          }
          return prev;
        });
      } else {
        alert("Erro ao solicitar participação");
      }
    } catch (err) {
      console.error(err);
      alert("Erro na requisição");
    }
  };

  // Handler para copiar link de compartilhamento
  const handleCopyLink = (challengeCode) => {
    const url = `${window.location.origin}/challenge/${challengeCode}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopiedCode(challengeCode);
        setTimeout(() => setCopiedCode(null), 3000);
      })
      .catch(() => alert("Erro ao copiar o link."));
  };

  // Handler para aprovação de convites
  const handleApproveInvitation = async (challengeId, participantId) => {
    try {
      const res = await fetch(`${API_URL}/challenges/${challengeId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ participant_id: participantId }),
      });
      
      if (res.ok) {
        alert("Participante aprovado!");
        // Atualizar a UI removendo o convite aprovado
        setPendingInvitations(prev => 
          prev.filter(item => item.participant.id !== participantId)
        );
      } else {
        alert("Erro ao aprovar participante.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro na operação.");
    }
  };

  // Handler para rejeição de convites
  const handleDenyInvitation = async (participantId) => {
    if (!window.confirm("Deseja rejeitar esta solicitação?")) return;
    
    try {
      const res = await fetch(`${API_URL}/challenge-participants/${participantId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      if (res.ok) {
        alert("Solicitação rejeitada!");
        // Atualizar a UI removendo o convite rejeitado
        setPendingInvitations(prev => 
          prev.filter(item => item.participant.id !== participantId)
        );
      } else {
        alert("Erro ao rejeitar solicitação.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro na operação.");
    }
  };

  // Função para resetar busca
  const resetSearch = () => {
    setSearchCode("");
    setSearchResult(null);
    setSearchError("");
  };

  // Função para tentar novamente em caso de erro
  const retryFetch = () => {
    effectRan.current = false;
    fetchInProgress.current = false;
    setLoading(true);
    setError(null);
  };

  if (!user) return <p>Por favor, faça login.</p>;
  
  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 dark:bg-opacity-20 border border-red-400 text-red-700 dark:text-red-300 rounded mb-4">
        <p>{error}</p>
        <button 
          onClick={retryFetch}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Meus Desafios</h1>

      {/* Seção Principais Ações */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col items-center justify-center">
          <Link 
            to="/challenges/create" 
            className="text-green-500 hover:text-green-600 flex flex-col items-center"
          >
            <FontAwesomeIcon icon={faPlus} className="text-4xl mb-2" />
            <span className="font-semibold">Criar Desafio</span>
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="font-bold mb-3 flex items-center">
            <FontAwesomeIcon icon={faSearch} className="mr-2 text-blue-500" />
            Buscar Desafio
          </h2>
          <form onSubmit={handleSearch} className="flex mb-1">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              placeholder="Digite o código"
              className="flex-1 p-2 border rounded-l dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
            >
              Buscar
            </button>
          </form>
          <p className="text-xs text-gray-500 dark:text-gray-400">Ex: RHRPTU</p>
          
          {/* Resultado da busca */}
          {searchError && (
            <p className="text-red-500 text-sm mt-2">{searchError}</p>
          )}
          
          {searchResult && (
            <div className="mt-3 p-3 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <h3 className="font-bold">{searchResult.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(searchResult.start_date).toLocaleDateString()} - {new Date(searchResult.end_date).toLocaleDateString()}
              </p>
              
              <div className="mt-2 flex justify-between">
                <button
                  onClick={() => handleJoinChallenge(searchResult.id)}
                  disabled={searchResult.requested}
                  className={`text-sm px-3 py-1 rounded 
                    ${searchResult.requested 
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-600" 
                      : "bg-green-500 text-white hover:bg-green-600"}`}
                >
                  {searchResult.requested ? "Solicitado" : "Participar"}
                </button>
                <button
                  onClick={resetSearch}
                  className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Limpar
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="font-bold mb-3 flex items-center">
            <FontAwesomeIcon icon={faTrophy} className="mr-2 text-yellow-500" />
            Estatísticas
          </h2>
          <div className="flex justify-around text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">{activeChallenges.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Desafios ativos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-500">{myCreatedChallenges.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Criados por mim</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">{pendingInvitations.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Convites pendentes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Desafios Ativos */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <FontAwesomeIcon icon={faFire} className="mr-2 text-orange-500" />
          Meus Desafios Ativos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeChallenges.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500 text-4xl mb-4" />
              <p className="text-xl font-bold mb-2">Nenhum desafio ativo</p>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Você ainda não tem desafios ativos. Crie um novo ou participe de um existente.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-2">
                <Link 
                  to="/challenges/create" 
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  Criar Desafio
                </Link>
              </div>
            </div>
          ) : (
            activeChallenges.map((item) => {
              const { challenge, participant } = item;
              const progress = challenge.target ? (participant.progress / challenge.target) * 100 : 0;
              
              return (
                <div 
                  key={challenge.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-105"
                >
                  <div className="h-2 bg-gray-200 dark:bg-gray-700">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${Math.min(100, progress)}%` }}
                    ></div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg">{challenge.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{challenge.modality}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs">{participant.progress} / {challenge.target}</span>
                      <span className="text-xs">{Math.round(progress)}%</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link 
                        to={`/challenge/${challenge.id}/dashboard`}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1 rounded text-center"
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to={`/challenge/${challenge.id}/checkins`}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded text-center"
                      >
                        Check-in
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Desafios Criados */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <FontAwesomeIcon icon={faUserPlus} className="mr-2 text-blue-500" />
          Desafios Criados por Mim
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCreatedChallenges.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Você ainda não criou nenhum desafio.
              </p>
              <Link 
                to="/challenges/create" 
                className="mt-4 inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Criar primeiro desafio
              </Link>
            </div>
          ) : (
            myCreatedChallenges.map((challenge) => {
              const now = new Date();
              const startDate = new Date(challenge.start_date);
              const endDate = new Date(challenge.end_date);
              const isActive = now >= startDate && now <= endDate;
              const isPending = now < startDate;
              const isFinished = now > endDate;
              
              return (
                <div key={challenge.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{challenge.title}</h3>
                    <div 
                      className={`text-xs px-2 py-1 rounded ${
                        isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-40 dark:text-green-300" : 
                        isPending ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-40 dark:text-yellow-300" :
                        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {isActive ? "Ativo" : isPending ? "Em breve" : "Finalizado"}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                  </p>
                  
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/challenge/${challenge.id}/dashboard`}
                        className="text-blue-500 hover:text-blue-600 text-sm"
                      >
                        Ver
                      </Link>
                      
                      {isPending && (
                        <Link 
                          to={`/challenges/${challenge.id}/edit`}
                          className="text-yellow-500 hover:text-yellow-600 text-sm"
                        >
                          Editar
                        </Link>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => handleCopyLink(challenge.code)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm flex items-center"
                      title="Compartilhar"
                    >
                      <FontAwesomeIcon icon={faShare} className="mr-1" />
                      {copiedCode === challenge.code ? (
                        <span className="text-green-500">Copiado!</span>
                      ) : (
                        <>Código: {challenge.code}</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Convites pendentes */}
      {pendingInvitations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2 text-green-500" />
            Aprovar Participantes
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {pendingInvitations.map((item) => (
              <div 
                key={item.participant.id}
                className="border-b last:border-0 border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row justify-between"
              >
                <div className="flex items-center mb-2 sm:mb-0">
                  <img
                    src={item.participant.user?.profile_image || "/placeholder.png"}
                    alt={item.participant.user?.username || "Usuário"}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                  <div>
                    <p className="font-medium">
                      {item.participant.user?.username || "Usuário"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Desafio: {item.challenge.title}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproveInvitation(item.challenge.id, item.participant.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleDenyInvitation(item.participant.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Botão Criar Desafio Fixo */}
      <div className="fixed bottom-6 right-6">
        <Link
          to="/challenges/create"
          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
        >
          <FontAwesomeIcon icon={faPlus} size="lg" />
        </Link>
      </div>
    </div>
  );
};

export default ImprovedHomepage;