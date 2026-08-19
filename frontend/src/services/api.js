import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const analyzePrompt = async (roughPrompt, technique) => {
  const response = await axios.post(`${API_BASE_URL}/analyze`, {
    rough_prompt: roughPrompt,
    technique: technique,
  });
  return response.data;
};

export const generateFinalPrompt = async (technique, components) => {
  const response = await axios.post(`${API_BASE_URL}/generate`, {
    technique: technique,
    components: components,
  });
  return response.data;
};