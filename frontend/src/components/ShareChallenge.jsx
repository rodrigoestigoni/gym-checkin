import React from "react";

const ShareChallenge = ({ challengeId }) => {
  const handleShare = () => {
    const url = `${window.location.origin}/challenges/${challengeId}`;
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copiado para a área de transferência!");
    }).catch(() => {
      alert("Erro ao copiar o link.");
    });
  };

  return (
    <button
      onClick={handleShare}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Compartilhar Desafio
    </button>
  );
};

export default ShareChallenge;
