import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 60 }); // 60 seconds

export default cache;
