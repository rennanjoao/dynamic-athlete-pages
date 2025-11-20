// Validation and sanitization utilities
export const sanitizeHTML = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const sanitizeInput = (input: string, maxLength: number = 500): string => {
  return sanitizeHTML(input.trim()).slice(0, maxLength);
};

export const validateTime = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const validateNumber = (value: string, min: number = 0, max: number = 99999): boolean => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

export const escapeForJSON = (obj: any): string => {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
};

export const validateExercise = (exercise: {
  exercicio: string;
  series: string;
  descanso: string;
  observacao: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!exercise.exercicio || exercise.exercicio.trim().length < 2) {
    errors.push('Nome do exercício deve ter pelo menos 2 caracteres');
  }

  if (exercise.exercicio.length > 200) {
    errors.push('Nome do exercício muito longo (máx. 200 caracteres)');
  }

  if (!exercise.series || exercise.series.trim().length === 0) {
    errors.push('Séries são obrigatórias');
  }

  if (exercise.observacao && exercise.observacao.length > 500) {
    errors.push('Observação muito longa (máx. 500 caracteres)');
  }

  return { valid: errors.length === 0, errors };
};

export const validateSupplement = (supplement: {
  nome: string;
  horario: string;
  observacao: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!supplement.nome || supplement.nome.trim().length < 2) {
    errors.push('Nome do suplemento deve ter pelo menos 2 caracteres');
  }

  if (supplement.nome.length > 200) {
    errors.push('Nome do suplemento muito longo (máx. 200 caracteres)');
  }

  if (supplement.horario && !validateTime(supplement.horario)) {
    errors.push('Horário inválido (use formato HH:MM)');
  }

  if (supplement.observacao && supplement.observacao.length > 500) {
    errors.push('Observação muito longa (máx. 500 caracteres)');
  }

  return { valid: errors.length === 0, errors };
};

export const validateWaterAmount = (amount: number): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (isNaN(amount)) {
    errors.push('Quantidade de água inválida');
  }

  if (amount < 0) {
    errors.push('Quantidade de água não pode ser negativa');
  }

  if (amount > 10) {
    errors.push('Valor inválido — máximo 10 L');
  }

  return { valid: errors.length === 0, errors };
};
