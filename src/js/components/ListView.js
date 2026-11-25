export class ListView {
  constructor(container, { onLike, onOpenDetail, onRetry } = {}) {
    this.container = container;
    this.onLike = onLike;
    this.onOpenDetail = onOpenDetail;
    this.onRetry = onRetry;
    this.likedIds = new Set(JSON.parse(localStorage.getItem('devforge_liked_ids') || '[]'));
  }

  _persistLikedIds() {
    localStorage.setItem('devforge_liked_ids', JSON.stringify([...this.likedIds]));
  }

  _escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  renderLoading(count = 6) {
    if (!this.container) return;
    this.container.setAttribute('aria-busy', 'true');
    this.container.innerHTML = Array.from({ length: count })
      .map(
        () => `
        <article class="tool-card tool-card--skeleton" aria-hidden="true">
          <div class="tool-card__header">
            <span class="skeleton-box" style="width: 90px; height: 20px;"></span>
            <span class="skeleton-box" style="width: 72px; height: 20px;"></span>
          </div>
          <div class="skeleton-box" style="width: 75%; height: 24px; margin: 12px 0;"></div>
          <div class="skeleton-box" style="width: 100%; height: 48px; margin-bottom: 12px;"></div>
          <div class="skeleton-box" style="width: 100%; height: 36px;"></div>
        </article>`,
      )
      .join('');
  }

  renderError(message) {
    if (!this.container) return;
    this.container.removeAttribute('aria-busy');
    this.container.innerHTML = `
      <div class="catalog-state catalog-state--error" role="alert">
        <h3>Failed to load utilities</h3>
        <p>${this._escapeHtml(message)}</p>
        <button type="button" class="btn btn--primary" data-action="retry">Retry Request</button>
      </div>
    `;
    this.container.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
      if (this.onRetry) this.onRetry();
    });
  }

  renderEmpty() {
    if (!this.container) return;
    this.container.removeAttribute('aria-busy');
    this.container.innerHTML = `
      <div class="catalog-state catalog-state--empty" role="status">
        <h3>No matching developer tools found</h3>
        <p>Try clearing the search query or switching to the "All" category filter.</p>
      </div>
    `;
  }

  renderItems(items) {
    if (!this.container) return;
    this.container.removeAttribute('aria-busy');

    if (!items || items.length === 0) {
      this.renderEmpty();
      return;
    }

    this.container.innerHTML = items
      .map((item) => {
        const isLiked = this.likedIds.has(String(item.id));
        const tagsHtml = (item.tags || [])
          .map((tag) => `<li class="tool-card__tag">${this._escapeHtml(tag)}</li>`)
          .join('');

        return `
          <article class="tool-card" data-id="${item.id}" itemscope itemtype="https://schema.org/SoftwareApplication">
            <header class="tool-card__header">
              <div class="tool-card__meta">
                <span class="tool-card__category-icon" aria-hidden="true">${this._escapeHtml(item.icon || '⚙')}</span>
                <span class="tool-card__category" itemprop="applicationCategory">${this._escapeHtml(item.categoryLabel || item.category)}</span>
              </div>
              <span class="tool-card__badge tool-card__badge--${this._escapeHtml(item.badgeType || 'success')}">
                ${this._escapeHtml(item.badge || '0ms Client')}
              </span>
            </header>

            <h3 class="tool-card__title" itemprop="name">
              <a href="#/item/${item.id}" class="tool-card__link" data-action="open-detail" data-id="${item.id}">
                ${this._escapeHtml(item.title)}
              </a>
            </h3>

            <p class="tool-card__description" itemprop="description">
              ${this._escapeHtml(item.description)}
            </p>

            <div class="tool-card__code-preview" aria-hidden="true">
              <code>${this._escapeHtml(item.previewCode || '')}</code>
            </div>

            <footer class="tool-card__footer">
              <ul class="tool-card__tags" aria-label="Tool specifications">
                ${tagsHtml}
              </ul>
              <div class="tool-card__actions-group" style="display: flex; align-items: center; gap: 0.75rem;">
                <button
                  type="button"
                  class="tool-card__like-btn ${isLiked ? 'is-liked' : ''}"
                  data-action="like"
                  data-id="${item.id}"
                  data-likes="${item.likes || 0}"
                  aria-pressed="${isLiked}"
                  aria-label="Like ${this._escapeHtml(item.title)}"
                  title="Optimistic like (Alt+Click to simulate API failure rollback)"
                >
                  <span aria-hidden="true">${isLiked ? '♥' : '♡'}</span>
                  <span class="tool-card__like-count">${item.likes || 0}</span>
                </button>
                <a href="#/item/${item.id}" class="tool-card__action" data-action="open-detail" data-id="${item.id}">
                  <span>Inspect</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </footer>
          </article>
        `;
      })
      .join('');

    this._bindEvents();
  }

  renderDetailView(item) {
    if (!this.container) return;
    this.container.removeAttribute('aria-busy');
    const isLiked = this.likedIds.has(String(item.id));

    this.container.innerHTML = `
      <article class="tool-detail-panel" style="grid-column: 1 / -1;">
        <div style="margin-bottom: 1rem;">
          <a href="#/list" class="btn btn--secondary" data-action="back-list">&larr; Back to Catalog</a>
        </div>
        <header class="tool-card__header">
          <div class="tool-card__meta">
            <span class="tool-card__category-icon">${this._escapeHtml(item.icon)}</span>
            <span class="tool-card__category">${this._escapeHtml(item.categoryLabel)}</span>
          </div>
          <span class="tool-card__badge tool-card__badge--${this._escapeHtml(item.badgeType)}">${this._escapeHtml(item.badge)}</span>
        </header>
        <h2 style="margin: 0.75rem 0;">${this._escapeHtml(item.title)}</h2>
        <p style="margin-bottom: 1rem; opacity: 0.85;">${this._escapeHtml(item.description)}</p>
        <div class="tool-card__code-preview" style="margin-bottom: 1.25rem;">
          <pre style="margin: 0; overflow-x: auto;"><code>${this._escapeHtml(item.snippet || item.previewCode)}</code></pre>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <button
            type="button"
            class="btn btn--secondary tool-card__like-btn ${isLiked ? 'is-liked' : ''}"
            data-action="like"
            data-id="${item.id}"
            data-likes="${item.likes || 0}"
            aria-pressed="${isLiked}"
          >
            <span>${isLiked ? '♥ Liked' : '♡ Upvote Tool'}</span>
            (<span class="tool-card__like-count">${item.likes || 0}</span>)
          </button>
          <a href="./tool-details.html?id=${item.id}" class="btn btn--primary">Open Interactive Sandbox &rarr;</a>
        </div>
      </article>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    this.container.querySelectorAll('[data-action="like"]').forEach((btn) => {
      btn.addEventListener('click', async (event) => {
        const id = btn.dataset.id;
        const prevLikes = Number(btn.dataset.likes);
        const wasLiked = this.likedIds.has(String(id));
        const nextLikes = wasLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1;
        const simulateFailure = event.altKey;

        // 1. Оптимістичне оновлення UI миттєво
        if (wasLiked) {
          this.likedIds.delete(String(id));
        } else {
          this.likedIds.add(String(id));
        }
        this._persistLikedIds();
        this._updateLikeButtonDom(btn, nextLikes, !wasLiked);

        // 2. Синхронізація з json-server із відкатом при помилці
        if (this.onLike) {
          try {
            await this.onLike(id, nextLikes, simulateFailure);
          } catch (err) {
            if (wasLiked) {
              this.likedIds.add(String(id));
            } else {
              this.likedIds.delete(String(id));
            }
            this._persistLikedIds();
            this._updateLikeButtonDom(btn, prevLikes, wasLiked);
            this._showToast(`Rollback: ${err.message}`);
          }
        }
      });
    });

    this.container.querySelectorAll('[data-action="open-detail"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        if (this.onOpenDetail) {
          e.preventDefault();
          this.onOpenDetail(link.dataset.id);
        }
      });
    });
  }

  _updateLikeButtonDom(btn, count, liked) {
    btn.dataset.likes = String(count);
    btn.setAttribute('aria-pressed', String(liked));
    btn.classList.toggle('is-liked', liked);
    const countEl = btn.querySelector('.tool-card__like-count');
    if (countEl) countEl.textContent = String(count);
    const iconEl = btn.querySelector('span[aria-hidden="true"]');
    if (iconEl) iconEl.textContent = liked ? '♥' : '♡';
  }

  _showToast(text) {
    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.textContent = text;
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#ef4444',
      color: '#fff',
      padding: '10px 16px',
      borderRadius: '8px',
      zIndex: '9999',
      fontSize: '14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
}

export default ListView;
