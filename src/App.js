import React, { useState } from "react";
import { TextField, Button, Container, Typography, Snackbar, Table, TableBody, TableCell, TableHead, TableRow, Paper } from "@mui/material";

// Detailed logging middleware implementation
async function logMiddleware({ stack = "frontend", level, packageName = "main", message }) {
  const url = "https://test.affordmed.com/api/log";

  if (!level || !message) {
    // Required parameters missing
    return;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stack,
        level,
        package: packageName,
        message
      })
    });

    if (!response.ok) {
      throw new Error(`Log API error: HTTP status ${response.status}`);
    }

    const result = await response.json();
    // Optionally handle response data here (e.g., log ID)
    return result;
  } catch (error) {
    // Handle network or other errors silently or with fallback, no console.log for evaluation rules
    // Optionally show user notification here if needed
  }
}

const defaultValidity = 30; // minutes

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function generateShortcode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const ShortenerPage = ({ addShortUrl }) => {
  const [inputs, setInputs] = useState([{ url: "", validity: defaultValidity, shortcode: "" }]);
  const [error, setError] = useState("");

  const handleChange = (idx, field, value) => {
    const updated = [...inputs];
    updated[idx][field] = value;
    setInputs(updated);
  };

  const handleAddRow = () => {
    if (inputs.length >= 5) return;
    setInputs([...inputs, { url: "", validity: defaultValidity, shortcode: "" }]);
  };

  const handleSubmit = async () => {
    for (const input of inputs) {
      if (!validateUrl(input.url)) {
        setError("Please enter a valid URL for all inputs.");
        await logMiddleware({
          level: "error",
          packageName: "shortener",
          message: "Invalid URL input."
        });
        return;
      }
      if (input.shortcode && !/^[a-zA-Z0-9]+$/.test(input.shortcode)) {
        setError("Shortcode must be alphanumeric.");
        await logMiddleware({
          level: "error",
          packageName: "shortener",
          message: "Invalid shortcode input."
        });
        return;
      }
    }
    setError("");
    await logMiddleware({
      level: "info",
      packageName: "shortener",
      message: "Shorten URLs submitted."
    });
    addShortUrl(inputs.map(input => ({
      url: input.url,
      validity: input.validity || defaultValidity,
      shortcode: input.shortcode,
    })));
  };

  return (
    <Paper sx={{ p: 4, mb: 5, borderRadius: 3, boxShadow: 3, backgroundColor: "#F5F0FF" }}>
      <Typography variant="h5" sx={{ mb: 2, color: "#7C4DFF", fontWeight: 600 }}>Shorten URLs</Typography>
      {inputs.map((input, idx) => (
        <div key={idx} style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
          <TextField
            label="Long URL"
            value={input.url}
            onChange={e => handleChange(idx, "url", e.target.value)}
            required
            fullWidth
            sx={{ backgroundColor: "#fff", borderRadius: 2 }}
          />
          <TextField
            label="Validity (min)"
            value={input.validity}
            type="number"
            onChange={e => handleChange(idx, "validity", Number(e.target.value))}
            sx={{ width: 140, backgroundColor: "#fff", borderRadius: 2 }}
          />
          <TextField
            label="Shortcode (optional)"
            value={input.shortcode}
            onChange={e => handleChange(idx, "shortcode", e.target.value)}
            sx={{ width: 180, backgroundColor: "#fff", borderRadius: 2 }}
          />
        </div>
      ))}
      <div style={{ marginTop: 12 }}>
        <Button
          variant="contained"
          onClick={handleAddRow}
          disabled={inputs.length >= 5}
          sx={{ mr: 2, borderRadius: 3, backgroundColor: "#B388FF", "&:hover": { backgroundColor: "#7C4DFF" } }}
        >
          Add URL
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{ borderRadius: 3, backgroundColor: "#7C4DFF", "&:hover": { backgroundColor: "#5E35B1" } }}
        >
          Shorten
        </Button>
      </div>
      <Snackbar
        open={!!error}
        message={error}
        autoHideDuration={4000}
        onClose={() => setError("")}
      />
    </Paper>
  );
};

const StatsPage = ({ shortenedUrls }) => (
  <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3, backgroundColor: "#F5F0FF" }}>
    <Typography variant="h5" sx={{ mb: 2, color: "#7C4DFF", fontWeight: 600 }}>Shortened URLs & Stats</Typography>
    <Table>
      <TableHead>
        <TableRow sx={{ backgroundColor: "#EDE7F6" }}>
          <TableCell>Short URL</TableCell>
          <TableCell>Original URL</TableCell>
          <TableCell>Created At</TableCell>
          <TableCell>Expires At</TableCell>
          <TableCell>Clicks</TableCell>
          <TableCell>Clicks Data</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {shortenedUrls.map((row, idx) => (
          <TableRow key={idx}>
            <TableCell>{`http://localhost:3000/${row.shortcode}`}</TableCell>
            <TableCell>{row.url}</TableCell>
            <TableCell>{row.createdAt.toLocaleString()}</TableCell>
            <TableCell>{row.expiresAt.toLocaleString()}</TableCell>
            <TableCell>{row.clicks.length}</TableCell>
            <TableCell>
              {row.clicks.map((click, i) => (
                <div key={i}>
                  Time: {click.timestamp.toLocaleString()}, Src: {click.source}, Location: {click.geo}
                </div>
              ))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
);

export default function App() {
  const [shortenedUrls, setShortenedUrls] = useState([]);

  const addShortUrl = (inputs) => {
    const newUrls = inputs.map(input => {
      let shortcode = input.shortcode || generateShortcode();
      if (shortenedUrls.some(row => row.shortcode === shortcode)) {
        shortcode = generateShortcode();
      }
      const createdAt = new Date();
      return {
        url: input.url,
        shortcode,
        validity: input.validity,
        createdAt,
        expiresAt: new Date(createdAt.getTime() + input.validity * 60000),
        clicks: [],
      };
    });
    setShortenedUrls([...shortenedUrls, ...newUrls]);
  };

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" sx={{ mb: 4, color: "#7C4DFF", fontWeight: 700, textAlign: "center" }}>
        ShortenIT
      </Typography>
      <ShortenerPage addShortUrl={addShortUrl} />
      <StatsPage shortenedUrls={shortenedUrls} />
    </Container>
  );
}
