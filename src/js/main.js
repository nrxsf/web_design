
import '../scss/main.scss';
import ItemService from './services/ItemService.js';
import ListView from './components/ListView.js';
import Paginator from './components/Paginator.js';
import HashRouter from './router/HashRouter.js';
import SubmissionForm from './components/SubmissionForm.js';

const CATEGORY_BY_TAB_TEXT = {
  all: 'all',
  formatters: 'formatters',
  converters: 'converters',
  security: 'security',
  encoders: 'encoders',
  web: 'web',
};

function initCatalogApp() {
  const gridContainer = document.querySelector('.catalog-grid__items');
  if (!gridContainer) return;

  const service = new ItemService();
  const state = {
    category: 'all',
    q: '',
    sort: 'popular',
    page: 1,
    limit: 9,
  };

  const searchInput = document.getElementById('catalog-search-input');
  const sortSelect = document.getElementById('sort-select');
  const densitySelect = document.getElementById('density-select');
  const filterTabs = [...document.querySelectorAll('.filter-chip')];
  const headerCounter = document.querySelector('.status-indicator__counter');

  filterTabs.forEach((tab) => {
    const label = tab.textContent.replace(/[0-9]/g, '').trim().split(/\s+/).pop()?.toLowerCase() || 'all';
    tab.dataset.category = CATEGORY_BY_TAB_TEXT[label] || 'all';
  });

  let router;

  const paginator = new Paginator(
    document.querySelector('.pagination__list'),
    document.querySelector('.catalog-pagination__info'),
    {
      onPageChange: (nextPage) => {
        state.page = nextPage;
        router.navigateToList(state);
      },
    },
  );

  const listView = new ListView(gridContainer, {
    onLike: (id, nextLikes, simulateFailure) => service.updateLikes(id, nextLikes, simulateFailure),
    onOpenDetail: (id) => router.navigateToItem(id),
    onRetry: () => loadList(),
  });

  function syncControlsWithState() {
    if (searchInput && searchInput.value !== state.q) searchInput.value = state.q;
    if (sortSelect) sortSelect.value = state.sort;
    if (densitySelect) densitySelect.value = String(state.limit);

    filterTabs.forEach((tab) => {
      const active = tab.dataset.category === state.category;
      tab.classList.toggle('filter-chip--active', active);
      tab.setAttribute('aria-selected', String(active));
    });
  }

  async function loadList() {
    syncControlsWithState();
    listView.renderLoading(Math.min(state.limit, 6));

    try {
      const result = await service.getTools(state);
      listView.renderItems(result.items);
      paginator.render(result);

      if (headerCounter) {
        const sourceLabel = result.fromCache ? ' (cached)' : '';
        headerCounter.textContent = `Showing ${result.items.length} of ${result.total} tools${sourceLabel}`;
      }
    } catch (err) {
      listView.renderError(err.message);
    }
  }

  async function loadDetail(id) {
    listView.renderLoading(1);
    try {
      const item = await service.getToolById(id);
      listView.renderDetailView(item);
    } catch (err) {
      listView.renderError(err.message);
    }
  }

  router = new HashRouter({
    onRouteChange: ({ route, id, params }) => {
      if (route === 'item' && id) {
        loadDetail(id);
        return;
      }

      state.category = params.category || 'all';
      state.q = params.q || '';
      state.sort = params.sort || 'popular';
      state.page = Number(params.page) || 1;
      state.limit = Number(params.limit) || 9;
      loadList();
    },
  });

  // Фільтр за категорією
  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      state.category = tab.dataset.category || 'all';
      state.page = 1;
      router.navigateToList(state);
    });
  });

  // Пошук із debounce 300 мс
  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.q = searchInput.value;
      state.page = 1;
      router.navigateToList(state);
    }, 300);
  });

  // Сортування та кількість на сторінці
  sortSelect?.addEventListener('change', () => {
    state.sort = sortSelect.value;
    state.page = 1;
    router.navigateToList(state);
  });

  densitySelect?.addEventListener('change', () => {
    state.limit = Number(densitySelect.value) || 9;
    state.page = 1;
    router.navigateToList(state);
  });

  // Форма створення нової утиліти
  new SubmissionForm(document.getElementById('new-tool-form'), {
    onSubmitTool: async (payload) => {
      await service.createTool(payload);
      state.page = 1;
      router.navigateToList(state);
    },
  });

  // Початкова ініціалізація маршруту
  const initialRoute = router.parseHash();
  if (initialRoute.route === 'item' && initialRoute.id) {
    loadDetail(initialRoute.id);
  } else {
    state.category = initialRoute.params.category || 'all';
    state.q = initialRoute.params.q || '';
    state.sort = initialRoute.params.sort || 'popular';
    state.page = Number(initialRoute.params.page) || 1;
    state.limit = Number(initialRoute.params.limit) || 9;
    loadList();
  }
}

document.addEventListener('DOMContentLoaded', initCatalogApp);
