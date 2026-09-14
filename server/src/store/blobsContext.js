let rawEvent = null;

export const setBlobsEvent = (event) => {
  rawEvent = event || null;
};

export const getBlobsEvent = () => rawEvent;
