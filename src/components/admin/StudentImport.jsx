import React from "react";
import {
  Box as Bx,
  Paper,
  Typography as T,
  Button as B,
  Divider,
  TextField as Tf,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Pagination,
  Tab,
  Tabs,
  Alert,
  Chip,
  InputAdornment,
  Snackbar,
} from "@mui/material";
import {
  PersonAdd,
  Delete,
  Email,
  Person,
  Upload,
  CloudUpload,
  PersonAddAlt,
  Group,
  Search,
  Visibility,
  Numbers,
} from "@mui/icons-material";
import { useState, useRef, useEffect } from "react";
import Papa from "papaparse";

export default function StudentImport({ 
  students = [], 
  onStudentsChange, 
  onPreviewStudent,
  onCsvUpload,
  onManualAdd,
  csvOnly = false // New prop to determine if this should only handle CSV files without processing
}) {
  const [tabValue, setTabValue] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [registration, setRegistration] = useState("");
  const [error, setError] = useState("");
  const [csvError, setCsvError] = useState("");
  const fileInputRef = useRef(null);
  const [showStudentList, setShowStudentList] = useState(students.length > 0);
  const [successAlert, setSuccessAlert] = useState({ open: false, message: "" });

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 50;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError("");
    setCsvError("");
  };

  const handleAddStudent = () => {
    // Basic validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Email validation with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Invalid email format");
      return;
    }

    // Check for duplicate email
    if (students.some((student) => student.email === email.trim())) {
      setError("This email is already in the list");
      return;
    }
    
    // Registration validation - if provided, check if it's already in use
    if (registration.trim() && students.some((student) => 
        student.registration && student.registration.trim() === registration.trim())) {
      setError("This registration number is already in use");
      return;
    }

    // Add student to list
    const newStudent = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      registration: registration.trim(),
    };

    onStudentsChange([...students, newStudent]);
    setShowStudentList(true);

    // Call manual add callback if provided
    if (onManualAdd) {
      onManualAdd();
    }

    // Show success message
    setSuccessAlert({ open: true, message: "Student added successfully!" });

    // Reset form
    setName("");
    setEmail("");
    setRegistration("");
    setError("");
  };

  const handleRemoveStudent = (index) => {
    const updatedStudents = [...students];
    updatedStudents.splice(index, 1);
    onStudentsChange(updatedStudents);
  };

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset previous errors
    setCsvError("");

    // Check file type - be more permissive with file types
    const isCSV = file.type === "text/csv" || 
                  file.name.endsWith(".csv") || 
                  file.type === "application/vnd.ms-excel" ||
                  file.type === "application/octet-stream";
                  
    if (!isCSV) {
      setCsvError("Please upload a CSV file (*.csv)");
      return;
    }

    // If csvOnly mode, just pass the file to parent without processing
    if (csvOnly) {
      console.log('CSV only mode - uploading file:', file.name);
      if (onCsvUpload) {
        console.log('Calling onCsvUpload callback');
        onCsvUpload(file);
      }
      setSuccessAlert({ 
        open: true, 
        message: `CSV file "${file.name}" attached successfully!`
      });
      // Reset file input
      event.target.value = null;
      return;
    }

    // Original processing logic for when we need to parse the CSV
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target.result;
      
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setCsvError(`CSV parsing error: ${results.errors[0].message}`);
            return;
          }

          // Process the data
          try {
            const validStudents = [];
            const emails = new Set();
            const registrations = new Set(); // Track registration numbers to prevent duplicates
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const duplicateWarnings = []; // Track duplicate emails with row numbers

            results.data.forEach((row, index) => {
              // Find the columns - be more flexible with column names
              const nameKey = Object.keys(row).find(
                (key) => key.toLowerCase().includes("name")
              ) || Object.keys(row)[0]; // Default to first column if no name column
              
              const emailKey = Object.keys(row).find(
                (key) => key.toLowerCase().includes("email")
              ) || Object.keys(row)[1]; // Default to second column if no email column

              // Find registration number column with more variations
              const registrationKey = Object.keys(row).find(
                (key) => key.toLowerCase().includes("registration") || 
                         key.toLowerCase().includes("reg") || 
                         key.toLowerCase().includes("reg.") ||
                         key.toLowerCase().includes("regno") || 
                         key.toLowerCase().includes("reg no") || 
                         key.toLowerCase().includes("student id") || 
                         key.toLowerCase().includes("studentid") ||
                         key.toLowerCase().includes("roll") ||
                         key.toLowerCase().includes("roll no")
              );

              if (!nameKey || !emailKey) {
                throw new Error(
                  "CSV must contain at least two columns for name and email"
                );
              }

              const name = row[nameKey]?.trim() || "";
              const email = row[emailKey]?.trim().toLowerCase() || "";
              const registration = registrationKey ? row[registrationKey]?.trim() || "" : "";

              if (!name) {
                throw new Error(`Row ${index + 2}: Name is required`);
              }

              if (!email) {
                throw new Error(`Row ${index + 2}: Email is required`);
              }

              if (!emailRegex.test(email)) {
                throw new Error(
                  `Row ${index + 2}: Invalid email format: ${email}`
                );
              }

              // Check for duplicate emails within CSV
              if (emails.has(email)) {
                // Add to duplicate warnings instead of throwing error
                duplicateWarnings.push(`Row ${index + 2}: Duplicate email "${email}"`);
                return; // Skip this row but continue processing
              }

              // Check for duplicate registration numbers if provided
              if (registration && registrations.has(registration)) {
                throw new Error(
                  `Row ${index + 2}: Duplicate registration number: ${registration}`
                );
              }

              emails.add(email);
              if (registration) {
                registrations.add(registration);
              }
              validStudents.push({ name, email, registration });
            });

            // Check for duplicates with existing students
            const duplicateEmails = new Set();
            const duplicateRegs = new Set();
            
            // First pass to identify duplicates
            validStudents.forEach(newStudent => {
              const emailExists = students.some(
                existingStudent => existingStudent.email === newStudent.email
              );
              
              const regExists = newStudent.registration && students.some(
                existingStudent => 
                  existingStudent.registration && 
                  existingStudent.registration === newStudent.registration
              );
              
              if (emailExists) duplicateEmails.add(newStudent.email);
              if (regExists) duplicateRegs.add(newStudent.registration);
            });
            
            // Filter out students with duplicate emails or registration numbers
            const newStudents = validStudents.filter(
              newStudent => 
                !duplicateEmails.has(newStudent.email) && 
                (!newStudent.registration || !duplicateRegs.has(newStudent.registration))
            );

            if (newStudents.length === 0 && duplicateWarnings.length === 0) {
              if (duplicateEmails.size > 0 || duplicateRegs.size > 0) {
                const emailMsg = duplicateEmails.size > 0 ? `${duplicateEmails.size} duplicate emails` : "";
                const regMsg = duplicateRegs.size > 0 ? `${duplicateRegs.size} duplicate registration numbers` : "";
                const conjunction = duplicateEmails.size > 0 && duplicateRegs.size > 0 ? " and " : "";
                
                setCsvError(`No new students added. Found ${emailMsg}${conjunction}${regMsg}.`);
              } else {
                setCsvError("No new students to add");
              }
              return;
            }

            // Add new students to the list
            const updatedStudents = [...students, ...newStudents];
            onStudentsChange(updatedStudents);
            setShowStudentList(true);
            
            // Call CSV upload callback if provided
            if (onCsvUpload) {
              onCsvUpload(file, updatedStudents);
            }
            
            // Show success message with warning if some were skipped
            const skippedCount = validStudents.length - newStudents.length;
            let message = "";
            
            if (newStudents.length > 0) {
              message = `${newStudents.length} students imported successfully!`;
              
              if (skippedCount > 0) {
                message += ` Skipped ${skippedCount} existing duplicates.`;
              }
              
              if (duplicateWarnings.length > 0) {
                message += ` Found ${duplicateWarnings.length} duplicate(s) in CSV.`;
              }
            } else {
              message = "No new students were added.";
            }
            
            // Show warnings for CSV duplicates
            if (duplicateWarnings.length > 0) {
              const warningMessage = duplicateWarnings.slice(0, 5).join(", ") + 
                (duplicateWarnings.length > 5 ? ` and ${duplicateWarnings.length - 5} more...` : "");
              setCsvError(`Warning: ${warningMessage}`);
            }
              
            setSuccessAlert({ 
              open: true, 
              message: message
            });

          } catch (error) {
            setCsvError(`Error processing CSV: ${error.message}`);
          }
        },
        error: (error) => {
          setCsvError(`Error reading CSV file: ${error.message}`);
        }
      });
    };
    
    reader.onerror = () => {
      setCsvError("Error reading the file");
    };
    
    reader.readAsText(file);

    // Reset file input
    event.target.value = null;
  };

  const clearAllStudents = () => {
    onStudentsChange([]);
    setShowStudentList(false);
  };
  
  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Filter students based on search term, including registration
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.registration && student.registration.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const displayedStudents = filteredStudents.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <Bx>
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab icon={<PersonAdd />} label="Add Manually" iconPosition="start" />
          <Tab icon={<Upload />} label="Upload CSV" iconPosition="start" />
        </Tabs>

        <Bx sx={{ p: 3 }}>
          {/* Add Manually Tab */}
          {tabValue === 0 && (
            <Stack spacing={2}>
              <Tf
                label="Student Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                variant="outlined"
                error={error && error.includes("Name")}
                InputProps={{
                  startAdornment: (
                    <Person sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
              />

              <Tf
                label="Student Email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                error={
                  error &&
                  (error.includes("Email") || error.includes("email"))
                }
                InputProps={{
                  startAdornment: (
                    <Email sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
              />

              <Tf
                label="Registration Number"
                fullWidth
                value={registration}
                onChange={(e) => setRegistration(e.target.value)}
                variant="outlined"
                error={error && (error.includes("Registration") || error.includes("registration"))}
                InputProps={{
                  startAdornment: (
                    <Numbers sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                }}
              />

              {error && <Alert severity="error">{error}</Alert>}

              <B
                variant="contained"
                startIcon={<PersonAddAlt />}
                onClick={handleAddStudent}
              >
                Add Student
              </B>
            </Stack>
          )}

          {/* Upload CSV Tab */}
          {tabValue === 1 && (
            <Stack spacing={2} alignItems="center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />

              <Bx
                sx={{
                  border: "2px dashed",
                  borderColor: "primary.main",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  width: "100%",
                  cursor: "pointer",
                }}
                onClick={handleFileSelect}
              >
                <CloudUpload
                  sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
                />
                <T variant="h6" gutterBottom>
                  Upload CSV File
                </T>
                <T variant="body2" color="text.secondary">
                  CSV should include columns for name, email, and registration number
                </T>
              </Bx>

              {csvError && <Alert severity="error">{csvError}</Alert>}
            </Stack>
          )}
        </Bx>
      </Paper>

      {/* Student List */}
      {students.length > 0 && (
        <Paper variant="outlined" sx={{ mb: 3 }}>
          <Bx sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: 1, borderColor: "divider" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Group color="primary" />
              <T variant="h6">Recipients</T>
              <Chip 
                label={students.length}
                color="primary"
                size="small"
              />
            </Stack>
            <Bx>
              <B
                variant="outlined"
                color="error"
                size="small"
                onClick={clearAllStudents}
              >
                Clear All
              </B>
            </Bx>
          </Bx>
          
          {/* Search Bar */}
          <Bx sx={{ p: 2, pb: 1 }}>
            <Tf
              fullWidth
              placeholder="Search by name, email or registration number..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Bx>

          <List sx={{ maxHeight: "300px", overflowY: "auto" }}>
            {displayedStudents.map((student, index) => {
              // Calculate the actual index in the original array
              const actualIndex = filteredStudents.indexOf(student);
              return (
                <ListItem
                  key={actualIndex}
                  divider={index < displayedStudents.length - 1}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => {
                          if (onPreviewStudent) {
                            onPreviewStudent(student);
                          }
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveStudent(actualIndex)}
                        color="error"
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemIcon>
                    <Email color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={student.name}
                    secondary={
                      <React.Fragment>
                        {student.email}
                        {student.registration && (
                          <span style={{ display: 'block', color: '#666' }}>
                            Reg: {student.registration}
                          </span>
                        )}
                      </React.Fragment>
                    }
                  />
                </ListItem>
              );
            })}
            
            {displayedStudents.length === 0 && (
              <ListItem>
                <ListItemText
                  primary={
                    <T align="center" color="text.secondary" sx={{ py: 2 }}>
                      {searchTerm ? "No matching recipients found" : "No recipients added yet"}
                    </T>
                  }
                />
              </ListItem>
            )}
          </List>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Bx sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Bx>
          )}
        </Paper>
      )}
      
      {/* Success Alert Snackbar */}
      <Snackbar
        open={successAlert.open}
        autoHideDuration={3000}
        onClose={() => setSuccessAlert({ ...successAlert, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ mb: 2, mr: 2 }}
      >
        <Alert 
          onClose={() => setSuccessAlert({ ...successAlert, open: false })} 
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {successAlert.message}
        </Alert>
      </Snackbar>
    </Bx>
  );
}