export default class Controller {
  #view;
  #worker;
  #service;
  #events = {
    alive: () => {
      console.log("alive");
    },
    progress: ({ total }) => {
      this.#view.updateProgress(total);
    },
    ocurrenceUpdate: ({ found, lines, took }) => {
      const [[key, value]] = Object.entries(found);
      this.#view.updateDebugLog(
        `Found ${value} ocurrences of ${key} in ${lines} lines. Took ${took}\n`
      );
    },
  };

  constructor({ view, worker, service }) {
    this.#view = view;
    this.#worker = this.#configureWorker(worker);
    this.#service = service;
  }

  static init(deps) {
    const controller = new Controller(deps);
    controller.init();

    return controller;
  }

  init() {
    this.#view.configureOnFileChange(this.#configureOnFileChange.bind(this));
    this.#view.configureOnFormSubmit(this.#configureOnFormSubmit.bind(this));
  }

  #configureWorker(worker) {
    worker.onmessage = ({ data }) => this.#events[data.eventType](data);

    return worker;
  }

  #formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];

    let i = 0;

    for (i; bytes >= 1024 && i < 4; i++) {
      bytes /= 1024;
    }
    return `${bytes.toFixed(2)} ${units[i]}`;
  }

  #configureOnFileChange(file) {
    this.#view.setFileSize(this.#formatBytes(file.size));
  }

  #configureOnFormSubmit({ file, description }) {
    const query = {};
    query["call description"] = new RegExp(description, "i");

    if (this.#view.isWorkerEnabled()) {
      console.log("executing on worker thread");
      this.#worker.postMessage({ query, file });
      return;
    }

    console.log("executing on main thread");
    this.#service.processFile({
      query,
      file,
      onOcurrenceUpdate: (...args) => this.#events.ocurrenceUpdate(...args),
      onProgress: (total) => this.#events.progress({ total }),
    });
  }
}
