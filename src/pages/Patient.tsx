// src/pages/Patient.tsx (optional welcome screen)
import React from "react";
import { Container, Typography } from "@mui/material";

export default function Patient() {
  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4 }}>
        Welcome to Your Patient Portal
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Use the navigation menu above to access your vitals and appointments.
      </Typography>
    </Container>
  );
}
