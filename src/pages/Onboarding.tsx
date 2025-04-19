// src/pages/Onboarding.tsx
import React, { useState } from "react";
import {
  Container,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Button,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const steps = ["Personal Details", "Health Details", "Lifestyle Data", "Review"];

const Onboarding = () => {
  const [activeStep, setActiveStep] = useState(0);
  
  // Personal Details
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  
  // Health Details
  const [bmi, setBmi] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  
  // Lifestyle Data
  const [physicalActivity, setPhysicalActivity] = useState("");
  const [diet, setDiet] = useState("");
  const [alcoholUse, setAlcoholUse] = useState("");
  const [smokingHabits, setSmokingHabits] = useState("");
  const [stressLevels, setStressLevels] = useState("");

  const navigate = useNavigate();

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      if (!auth.currentUser) return;
      // Update user document with onboarding details
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { 
        age, 
        gender, 
        bmi, 
        ethnicity,
        physicalActivity,
        diet,
        alcoholUse,
        smokingHabits,
        stressLevels
      });
      // Redirect to dashboard (or another page) after onboarding is complete
      navigate(`/${"patient"}`); // Adjust role as needed
    } catch (error: any) {
      console.error("Error updating onboarding data:", error.message);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div>
            <TextField
              label="Age"
              type="number"
              fullWidth
              margin="normal"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <FormControl component="fieldset" margin="normal">
              <RadioGroup row value={gender} onChange={(e) => setGender(e.target.value)}>
                <FormControlLabel value="male" control={<Radio />} label="Male" />
                <FormControlLabel value="female" control={<Radio />} label="Female" />
                <FormControlLabel value="other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>
          </div>
        );
      case 1:
        return (
          <div>
            <TextField
              label="BMI"
              type="number"
              fullWidth
              margin="normal"
              value={bmi}
              onChange={(e) => setBmi(e.target.value)}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="ethnicity-label">Ethnicity</InputLabel>
              <Select
                labelId="ethnicity-label"
                value={ethnicity}
                label="Ethnicity"
                onChange={(e) => setEthnicity(e.target.value)}
              >
                <MenuItem value="Asian">Asian</MenuItem>
                <MenuItem value="Black">Black</MenuItem>
                <MenuItem value="Hispanic">Hispanic</MenuItem>
                <MenuItem value="White">White</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </div>
        );
      case 2:
        return (
          <div>
            <FormControl fullWidth margin="normal">
              <InputLabel id="activity-label">Physical Activity</InputLabel>
              <Select
                labelId="activity-label"
                value={physicalActivity}
                label="Physical Activity"
                onChange={(e) => setPhysicalActivity(e.target.value)}
              >
                <MenuItem value="Sedentary">Sedentary</MenuItem>
                <MenuItem value="Lightly Active">Lightly Active</MenuItem>
                <MenuItem value="Moderately Active">Moderately Active</MenuItem>
                <MenuItem value="Very Active">Very Active</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="diet-label">Diet</InputLabel>
              <Select
                labelId="diet-label"
                value={diet}
                label="Diet"
                onChange={(e) => setDiet(e.target.value)}
              >
                <MenuItem value="Poor">Poor</MenuItem>
                <MenuItem value="Average">Average</MenuItem>
                <MenuItem value="Good">Good</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="alcohol-label">Alcohol Use</InputLabel>
              <Select
                labelId="alcohol-label"
                value={alcoholUse}
                label="Alcohol Use"
                onChange={(e) => setAlcoholUse(e.target.value)}
              >
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="Occasional">Occasional</MenuItem>
                <MenuItem value="Regular">Regular</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="smoking-label">Smoking Habits</InputLabel>
              <Select
                labelId="smoking-label"
                value={smokingHabits}
                label="Smoking Habits"
                onChange={(e) => setSmokingHabits(e.target.value)}
              >
                <MenuItem value="Non-smoker">Non-smoker</MenuItem>
                <MenuItem value="Former smoker">Former smoker</MenuItem>
                <MenuItem value="Current smoker">Current smoker</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="stress-label">Stress Levels</InputLabel>
              <Select
                labelId="stress-label"
                value={stressLevels}
                label="Stress Levels"
                onChange={(e) => setStressLevels(e.target.value)}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>
          </div>
        );
      case 3:
        return (
          <div>
            <Typography variant="h6" gutterBottom>
              Review Your Information
            </Typography>
            <Typography>Age: {age}</Typography>
            <Typography>Gender: {gender}</Typography>
            <Typography>BMI: {bmi}</Typography>
            <Typography>Ethnicity: {ethnicity}</Typography>
            <Typography>Physical Activity: {physicalActivity}</Typography>
            <Typography>Diet: {diet}</Typography>
            <Typography>Alcohol Use: {alcoholUse}</Typography>
            <Typography>Smoking Habits: {smokingHabits}</Typography>
            <Typography>Stress Levels: {stressLevels}</Typography>
          </div>
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div style={{ marginTop: 20 }}>{getStepContent(activeStep)}</div>
      <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between" }}>
        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Submit
          </Button>
        )}
      </div>
    </Container>
  );
};

export default Onboarding;
