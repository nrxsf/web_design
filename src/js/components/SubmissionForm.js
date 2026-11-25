const DRAFT_STORAGE_KEY = 'devforge_tool_submission_draft';

export class SubmissionForm {
  constructor(formElement, { onSubmitTool } = {}) {
    this.form = formElement;
    this.onSubmitTool = onSubmitTool;
    if (this.form) {
      this._restoreDraft();
      this._bindEvents();
    }
  }

  _restoreDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
      Object.entries(saved).forEach(([name, value]) => {
        const field = this.form.elements.namedItem(name);
        if (field && typeof value === 'string') {
          field.value = value;
        }
      });
    } catch {
      // Ignore invalid draft JSON
    }
  }

  _saveDraft() {
    const data = new FormData(this.form);
    const draft = Object.fromEntries(data.entries());
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }

  _validateField(field) {
    const errorEl = this.form.querySelector(`[data-error-for="${field.name}"]`);
    let errorMsg = '';

    if (field.validity.valueMissing) {
      errorMsg = 'This field is required.';
    } else if (field.validity.tooShort) {
      errorMsg = `Minimum length is ${field.minLength} characters.`;
    } else if (field.validity.tooLong) {
      errorMsg = `Maximum length is ${field.maxLength} characters.`;
    } else if (field.validity.patternMismatch) {
      errorMsg = field.dataset.patternHint || 'Invalid format.';
    } else if (field.validity.rangeUnderflow) {
      errorMsg = `Value must be at least ${field.min}.`;
    } else if (field.validity.rangeOverflow) {
      errorMsg = `Value must be at most ${field.max}.`;
    }

    field.setAttribute('aria-invalid', String(Boolean(errorMsg)));
    if (errorEl) {
      errorEl.textContent = errorMsg;
    }
    return !errorMsg;
  }

  _bindEvents() {
    const fields = [...this.form.querySelectorAll('input, select, textarea')];

    fields.forEach((field) => {
      field.addEventListener('input', () => {
        this._saveDraft();
        this._validateField(field);
      });
      field.addEventListener('blur', () => this._validateField(field));
    });

    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const isAllValid = fields.every((field) => this._validateField(field));
      const statusEl = this.form.querySelector('[data-form-status]');

      if (!isAllValid) {
        if (statusEl) {
          statusEl.textContent = 'Please fix the highlighted validation errors before submitting.';
          statusEl.style.color = '#ef4444';
        }
        return;
      }

      const formData = new FormData(this.form);
      const category = formData.get('category');
      const categoryMap = {
        formatters: 'Formatters',
        converters: 'Converters',
        security: 'Security',
        encoders: 'Encoders',
        web: 'Web',
      };

      const payload = {
        title: String(formData.get('title')).trim(),
        slug: String(formData.get('slug')).trim(),
        category,
        categoryLabel: categoryMap[category] || 'Web',
        icon: '⚡',
        latencyMs: Number(formData.get('latencyMs')),
        description: String(formData.get('description')).trim(),
        previewCode: `dev.tool.${String(formData.get('slug')).trim()}`,
        snippet: `// ${String(formData.get('title')).trim()}\nexport function run(input) {\n  return input;\n}`,
      };

      try {
        if (this.onSubmitTool) {
          await this.onSubmitTool(payload);
        }
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        this.form.reset();
        if (statusEl) {
          statusEl.textContent = 'Utility saved to json-server and added to catalog!';
          statusEl.style.color = '#10b981';
        }
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = `Saved locally in localStorage (API offline: ${err.message})`;
          statusEl.style.color = '#f59e0b';
        }
      }
    });
  }
}

export default SubmissionForm;
