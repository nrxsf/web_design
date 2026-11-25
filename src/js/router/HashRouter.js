export class HashRouter {
  constructor({ onRouteChange } = {}) {
    this.onRouteChange = onRouteChange;
    window.addEventListener('hashchange', () => this._handleHashChange());
  }

  parseHash() {
    const raw = window.location.hash.replace(/^#/, '') || '/list';
    const [pathPart, queryPart = ''] = raw.split('?');
    const params = Object.fromEntries(new URLSearchParams(queryPart).entries());

    const itemMatch = pathPart.match(/^\/item\/([^/]+)$/);
    if (itemMatch) {
      return { route: 'item', id: itemMatch[1], params };
    }

    return { route: 'list', params };
  }

  navigateToList(state = {}) {
    const searchParams = new URLSearchParams();
    if (state.category && state.category !== 'all') searchParams.set('category', state.category);
    if (state.q) searchParams.set('q', state.q);
    if (state.sort && state.sort !== 'popular') searchParams.set('sort', state.sort);
    if (state.page && state.page > 1) searchParams.set('page', String(state.page));
    if (state.limit && state.limit !== 9) searchParams.set('limit', String(state.limit));

    const qs = searchParams.toString();
    const nextHash = `#/list${qs ? `?${qs}` : ''}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    } else {
      this._handleHashChange();
    }
  }

  navigateToItem(id) {
    window.location.hash = `#/item/${id}`;
  }

  _handleHashChange() {
    if (this.onRouteChange) {
      this.onRouteChange(this.parseHash());
    }
  }
}

export default HashRouter;
