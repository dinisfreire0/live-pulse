import type { NewPoll } from '../../api/types.ts';
import Feedback from '../Feedback/Feedback.tsx';
import { MAX_OPTIONS, MIN_OPTIONS, usePollForm } from './PollForm.ts';
import './PollForm.scss';

interface PollFormProps {
  onSubmit: (poll: NewPoll) => Promise<void>;
}

export default function PollForm({ onSubmit }: PollFormProps) {
  const form = usePollForm(onSubmit);

  return (
    <form className="poll-form" onSubmit={form.submit} noValidate>
      <div className="poll-form__field">
        <label className="poll-form__label" htmlFor="poll-question">
          Pergunta
        </label>
        <input
          id="poll-question"
          className={`input${form.errors.question ? ' input--invalid' : ''}`}
          value={form.question}
          onChange={(event) => form.setQuestion(event.target.value)}
          maxLength={200}
          placeholder="Ex.: Qual o tema da próxima sessão?"
          aria-invalid={Boolean(form.errors.question)}
          aria-describedby={form.errors.question ? 'poll-question-error' : undefined}
          autoFocus
        />
        {form.errors.question && (
          <p id="poll-question-error" className="poll-form__error">
            {form.errors.question}
          </p>
        )}
      </div>

      <fieldset className="poll-form__field poll-form__options">
        <legend className="poll-form__label">
          Opções{' '}
          <span className="muted">
            ({MIN_OPTIONS} a {MAX_OPTIONS})
          </span>
        </legend>
        {form.options.map((option, index) => (
          <div key={option.key} className="poll-form__option">
            <span className="poll-form__option-index" aria-hidden="true">
              {index + 1}
            </span>
            <input
              className={`input${form.errors.options && !option.text.trim() ? ' input--invalid' : ''}`}
              value={option.text}
              onChange={(event) => form.updateOption(option.key, event.target.value)}
              maxLength={100}
              placeholder={`Opção ${index + 1}`}
              aria-label={`Opção ${index + 1}`}
            />
            <button
              type="button"
              className="btn btn--small poll-form__remove"
              onClick={() => form.removeOption(option.key)}
              disabled={!form.canRemoveOption}
              aria-label={`Remover opção ${index + 1}`}
            >
              ✕
            </button>
          </div>
        ))}
        {form.errors.options && <p className="poll-form__error">{form.errors.options}</p>}
        <button
          type="button"
          className="btn btn--small poll-form__add"
          onClick={form.addOption}
          disabled={!form.canAddOption}
        >
          + Adicionar opção
        </button>
      </fieldset>

      {form.errors.form && <Feedback kind="error">{form.errors.form}</Feedback>}

      <div className="poll-form__actions">
        <button type="submit" className="btn btn--primary" disabled={form.submitting}>
          {form.submitting ? 'A criar…' : 'Criar votação'}
        </button>
        <p className="muted poll-form__hint">A votação fica em Rascunho até a abrires.</p>
      </div>
    </form>
  );
}
