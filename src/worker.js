import Service from "./service.js";

const service = new Service();

postMessage({ eventType: "alive" });

onmessage = ({ data }) => {
  const { query, file } = data;
  service.processFile({
    query,
    file,
    onOcurrenceUpdate: (args) => {
      postMessage({ eventType: "ocurrenceUpdate", ...args });
    },
    onProgress: (total) => {
      postMessage({ eventType: "progress", total });
    },
  });
};
