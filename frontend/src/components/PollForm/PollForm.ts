import { type FormEvent, useRef, useState } from 'react';
import { toApiError } from '../../api/client.ts';
import type { NewPoll } from '../../api/types.ts';

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 5;

export interface PollFormErrors {
  question?: string;
  options?: string;
  form?: string;
}

interface OptionField {
  key: number;
  text: string;
}

export function validatePoll({ question, options }: NewPoll): PollFormErrors {
  const errors: PollFormErrors = {};
  if (!question) errors.question = 'A pergunta não pode estar vazia.';
  if (options.some((option) => !option)) {
    errors.options = 'As opções não podem estar vazias.';
  } else if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    errors.options = `Uma votação precisa de entre ${MIN_OPTIONS} e ${MAX_OPTIONS} opções.`;
  } else if (new Set(options.map((option) => option.toLowerCase())).size !== options.length) {
    errors.options = 'As opções não podem ser repetidas.';
  }
  return errors;
}

export function usePollForm(onSubmit: (poll: NewPoll) => Promise<void>) {
  const nextKey = useRef(MIN_OPTIONS);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<OptionField[]>(() =>
    Array.from({ length: MIN_OPTIONS }, (_, key) => ({ key, text: '' })),
  );
  const [errors, setErrors] = useState<PollFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const updateOption = (key: number, text: string) =>
    setOptions((current) =>
      current.map((option) => (option.key === key ? { ...option, text } : option)),
    );

  const addOption = () =>
    setOptions((current) =>
      current.length >= MAX_OPTIONS ? current : [...current, { key: nextKey.current++, text: '' }],
    );

  const removeOption = (key: number) =>
    setOptions((current) =>
      current.length <= MIN_OPTIONS ? current : current.filter((option) => option.key !== key),
    );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const poll: NewPoll = {
      question: question.trim(),
      options: options.map((option) => option.text.trim()),
    };

    const validationErrors = validatePoll(poll);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(poll);
    } catch (err) {
      const apiError = toApiError(err);
      const { question: questionErrors, options: optionErrors } = apiError.fieldErrors;
      setErrors({
        question: questionErrors?.[0],
        options: optionErrors?.[0],
        form: questionErrors || optionErrors ? undefined : apiError.message,
      });
      setSubmitting(false);
    }
  };

  return {
    question,
    setQuestion,
    options,
    updateOption,
    addOption,
    removeOption,
    canAddOption: options.length < MAX_OPTIONS,
    canRemoveOption: options.length > MIN_OPTIONS,
    errors,
    submitting,
    submit,
  };
}
