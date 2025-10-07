// src/pages/Terms.jsx
import React from "react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-800">
          Kushtet e Përdorimit
        </h1>

        <p className="mb-4 text-gray-700 text-lg leading-relaxed">
          Mirësevini në faqen tonë! Këto kushte rregullojnë përdorimin e produktit dhe shërbimeve tona.
        </p>

        <div className="mb-4 bg-gray-50 p-4 rounded border-l-4 border-blue-500">
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Pagesa jep përdoruesit akses në përmbajtje premium.</li>
            <li>Mund ta anuloni në çdo kohë.</li>
            <li>Përmbajtja është për përdorim personal vetëm.</li>
          </ul>
        </div>

        <p className="mb-4 text-gray-700 text-lg leading-relaxed">
          Duke përdorur faqen tonë dhe produktet, ju pranoni këto kushte dhe angazhimet që vijnë me to.
        </p>

    
      </div>
    </div>
  );
};

export default Terms;
