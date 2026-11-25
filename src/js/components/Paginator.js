
export class Paginator {
  constructor(listContainer, infoElement, { onPageChange } = {}) {
    this.listContainer = listContainer;
    this.infoElement = infoElement;
    this.onPageChange = onPageChange;
  }

  render({ page, totalPages, total, limit }) {
    if (this.infoElement) {
      if (total === 0) {
        this.infoElement.textContent = 'Showing 0 utilities';
      } else {
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        this.infoElement.textContent = `Showing ${start} - ${end} of ${total} utilities`;
      }
    }

    if (!this.listContainer) return;

    const prevDisabled = page <= 1;
    const nextDisabled = page >= totalPages;

    const pagesHtml = Array.from({ length: totalPages }, (_, idx) => idx + 1)
      .map(
        (p) => `
        <li class="pagination__item">
          <a
            href="#/list?page=${p}"
            class="pagination__link ${p === page ? 'pagination__link--active' : ''}"
            data-page="${p}"
            ${p === page ? 'aria-current="page"' : ''}
          >${p}</a>
        </li>`,
      )
      .join('');

    this.listContainer.innerHTML = `
      <li class="pagination__item">
        <a
          href="#/list?page=${Math.max(1, page - 1)}"
          class="pagination__link ${prevDisabled ? 'pagination__link--disabled' : ''}"
          data-page="${Math.max(1, page - 1)}"
          aria-disabled="${prevDisabled}"
        >&larr; Previous</a>
      </li>
      ${pagesHtml}
      <li class="pagination__item">
        <a
          href="#/list?page=${Math.min(totalPages, page + 1)}"
          class="pagination__link ${nextDisabled ? 'pagination__link--disabled' : ''}"
          data-page="${Math.min(totalPages, page + 1)}"
          aria-disabled="${nextDisabled}"
        >Next &rarr;</a>
      </li>
    `;

    this.listContainer.querySelectorAll('a[data-page]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (link.getAttribute('aria-disabled') === 'true') return;
        const targetPage = Number(link.dataset.page);
        if (targetPage !== page && this.onPageChange) {
          this.onPageChange(targetPage);
        }
      });
    });
  }
}

export default Paginator;
