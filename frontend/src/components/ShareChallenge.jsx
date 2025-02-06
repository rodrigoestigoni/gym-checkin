import React from "react";

const ShareChallenge = ({ challengeCode, user }) => {
  const handleShare = () => {
    const url = `${window.location.origin}/challenge/${challengeCode}`;
    navigator.clipboard.writeText(url)
      .then(() => alert("Link copiado para a área de transferência!"))
      .catch(() => alert("Erro ao copiar o link."));
  };

  return (
    <button
      onClick={handleShare}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      Compartilhar
    </button>
  );
};

export default ShareChallenge;
