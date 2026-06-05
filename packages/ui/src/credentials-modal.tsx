"use client";

import { useState } from "react";

interface CredentialsData {
  email: string;
  password: string;
  tenantCode?: string;
  loginUrl?: string;
  message?: string;
}

interface CredentialsModalProps {
  credentials: CredentialsData;
  title?: string;
  onClose: () => void;
}

export function CredentialsModal({ credentials, title = "Credenciales de acceso", onClose }: CredentialsModalProps) {
  const [copied, setCopied] = useState(false);

  const fullText = [
    title,
    "",
    `Email: ${credentials.email}`,
    `Contraseña: ${credentials.password}`,
    credentials.tenantCode ? `Código de mayorista: ${credentials.tenantCode}` : null,
    credentials.message ?? "Guarda estas credenciales. No podrás ver la contraseña de nuevo.",
  ].filter(Boolean).join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-4">{title}</h2>

        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-mono font-medium">{credentials.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Contraseña</span>
            <span className="font-mono font-medium">{credentials.password}</span>
          </div>
          {credentials.tenantCode && (
            <div className="flex justify-between">
              <span className="text-gray-500">Código mayorista</span>
              <span className="font-mono font-bold text-blue-700">{credentials.tenantCode}</span>
            </div>
          )}
        </div>

        {credentials.message && (
          <p className="text-amber-700 bg-amber-50 rounded-lg p-3 text-sm mb-4">
            {credentials.message}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            {copied ? "¡Copiado!" : "Copiar credenciales"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
