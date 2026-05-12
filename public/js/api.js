function buildApiErrorMessage(body, fallbackMessage) {
  if (!body) return fallbackMessage;

  const baseMessage = body.error || fallbackMessage;
  const detailLines = Object.entries(body.details || {})
    .map(([field, message]) => `${field}: ${message}`);

  if (!detailLines.length) return baseMessage;
  return `${baseMessage}\n${detailLines.join("\n")}`;
}

export async function getRequest(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => null);
  console.log("[API response]", {
    method: "GET",
    url,
    status: response.status,
    ok: response.ok,
    body: data
  });

  if (!response.ok) {
    const message = buildApiErrorMessage(data, `Request failed: ${url}`);
    throw new Error(message);
  }

  return data;
}

export async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);
  console.log("[API response]", {
    method: "POST",
    url,
    status: response.status,
    ok: response.ok,
    body: data
  });

  if (!response.ok) {
    const message = buildApiErrorMessage(data, `Request failed: ${url}`);
    throw new Error(message);
  }

  return data;
}

export async function putJson(url, payload) {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);
  console.log("[API response]", {
    method: "PUT",
    url,
    status: response.status,
    ok: response.ok,
    body: data
  });

  if (!response.ok) {
    const message = buildApiErrorMessage(data, `Request failed: ${url}`);
    throw new Error(message);
  }

  return data;
}

export async function deleteRequest(url) {
  const response = await fetch(url, { method: "DELETE" });
  const data = await response.json().catch(() => null);
  console.log("[API response]", {
    method: "DELETE",
    url,
    status: response.status,
    ok: response.ok,
    body: data
  });

  if (!response.ok) {
    const message = buildApiErrorMessage(data, `Request failed: ${url}`);
    throw new Error(message);
  }

  return data;
}
