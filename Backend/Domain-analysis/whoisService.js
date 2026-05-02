const pickFirstValue = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const nestedValue = pickFirstValue(...value);

      if (nestedValue) {
        return nestedValue;
      }
    } else if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const normalizeDate = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
};

const getEventDate = (events, eventNames) => {
  if (!Array.isArray(events)) {
    return null;
  }

  const match = events.find((event) =>
    eventNames.includes(String(event?.eventAction || "").toLowerCase()),
  );

  return normalizeDate(match?.eventDate);
};

const getEntityName = (entities) => {
  if (!Array.isArray(entities)) {
    return null;
  }

  for (const entity of entities) {
    const vcardArray = entity?.vcardArray?.[1];

    if (!Array.isArray(vcardArray)) {
      continue;
    }

    for (const field of vcardArray) {
      const fieldName = field?.[0];
      const fieldValue = field?.[3];

      if (fieldName === "fn" || fieldName === "org") {
        const value = pickFirstValue(fieldValue);

        if (value) {
          return value;
        }
      }
    }
  }

  return null;
};

export async function getWhoisData(domain) {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: {
        Accept: "application/rdap+json, application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`RDAP lookup failed with status ${response.status}`);
    }

    const data = await response.json();

    const registrar = pickFirstValue(
      data?.registrarName,
      data?.port43,
      data?.entities?.map((entity) => entity?.handle),
    ) || "Unknown";

    const creationDate =
      getEventDate(data?.events, ["registration", "registered"]) || null;

    const owner =
      getEntityName(data?.entities) ||
      pickFirstValue(data?.ldhName, data?.unicodeName) ||
      "Unknown";

    return {
      domain,
      registrar,
      creationDate,
      owner,
      raw: data,
    };
  } catch (error) {
    return {
      domain,
      registrar: "Unknown",
      creationDate: null,
      owner: "Unknown",
      raw: null,
    };
  }
}
