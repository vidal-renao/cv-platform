const isDev = process.env.NODE_ENV !== 'production';

// PostgreSQL error codes
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_NOT_NULL_VIOLATION = '23502';

const errorHandler = (err, req, res, next) => {
  if (isDev) {
    console.error(`[ERROR] ${req.method} ${req.url}`, err);
  }

  // PostgreSQL constraint errors
  if (err.code === PG_UNIQUE_VIOLATION) {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }
  if (err.code === PG_FOREIGN_KEY_VIOLATION) {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }
  if (err.code === PG_NOT_NULL_VIOLATION) {
    // Only expose the column name for fields that belong to the request schema.
    // Internal fields (e.g. package_id, user_id set by the server) should never
    // surface as user-facing validation errors.
    const internalFields = ['package_id', 'user_id', 'client_id'];
    if (internalFields.includes(err.column)) {
      console.error(`[ErrorHandler] Internal NOT NULL violation on '${err.column}' — this is a server bug, not a client error.`, err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    return res.status(400).json({ error: `Field '${err.column}' is required` });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  res.status(status).json({ error: message });
};

module.exports = { errorHandler };
