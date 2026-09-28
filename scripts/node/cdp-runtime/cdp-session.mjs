import { createHash } from 'node:crypto';

export class CdpSession {
  /**
   * @param {{ endpoint?: string, targetId?: string|null, targetPolicy?: 'required'|'first-page' }} [options]
   *   targetPolicy 'required' (default) fails closed when no targetId is given.
   *   'first-page' is an explicit opt-in to "whichever tab is first", for callers
   *   that only check CDP connectivity and make no claim about page identity.
   */
  constructor({ endpoint = 'http://127.0.0.1:9222', targetId = null, targetPolicy = 'required' } = {}) {
    if (!['required', 'first-page'].includes(targetPolicy)) throw new Error('unknown targetPolicy: ' + targetPolicy);
    this.endpoint = endpoint;
    this.targetId = targetId;
    this.targetPolicy = targetPolicy;
    this.targetResolvedBy = null;
    this.ws = null;
    this.nextId = 0;
    this.pending = new Map();
    this.state = 'DISCONNECTED';
  }

  async connect() {
    const targets = await (await fetch(`${this.endpoint}/json/list`)).json();
    let target;
    if (this.targetId) {
      target = targets.find(t => t.id === this.targetId);
      if (!target) throw new Error('CDP target not found: ' + this.targetId);
      this.targetResolvedBy = 'targetId';
    } else {
      if (this.targetPolicy !== 'first-page') throw new Error('CDP session requires an explicit targetId (set BLOGGER_TARGET_ID or pass targetPolicy: \'first-page\' to accept whichever tab is first)');
      target = targets.find(t => t.type === 'page');
      this.targetResolvedBy = 'first-page-fallback';
    }
    if (!target?.webSocketDebuggerUrl) throw new Error('No CDP page target available');
    this.targetId = target.id;
    this.ws = new WebSocket(target.webSocketDebuggerUrl);
    this.ws.onmessage = event => {
      const message = JSON.parse(event.data);
      const resolve = this.pending.get(message.id);
      if (resolve) { this.pending.delete(message.id); resolve(message); }
    };
    await new Promise((resolve, reject) => { this.ws.onopen = resolve; this.ws.onerror = reject; });
    this.state = 'CONNECTED';
    await this.call('Page.enable');
    await this.call('Runtime.enable');
    return target;
  }

  call(method, params = {}) {
    if (!this.ws) return Promise.reject(new Error('CDP session is not connected'));
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
      this.pending.set(id, message => { clearTimeout(timer); if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result); });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return result.result?.value;
  }

  async navigate(url) { return this.call('Page.navigate', { url }); }

  async snapshot() {
    return JSON.parse(await this.evaluate(`JSON.stringify({url:location.href,title:document.title,readyState:document.readyState,text:document.body?.innerText||'',html:document.documentElement?.outerHTML||'',capturedAt:new Date().toISOString()})`));
  }

  async screenshot() { return (await this.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })).data; }

  fingerprint(snapshot) { return createHash('sha256').update(snapshot.html || snapshot.text || '').digest('hex'); }

  close() { this.ws?.close(); this.state = 'DISCONNECTED'; }
}
