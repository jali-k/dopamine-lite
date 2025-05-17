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
    Visibility
  } from "@mui/icons-material";
  import { useState, useRef, useEffect } from "react";
  import Papa from "papaparse";
  
  export default function StudentImport({ students = [], onStudentsChange, onPreviewStudent }) {
    const [tabValue, setTabValue] = useState(0);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
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
  
      // Add student to list
      const newStudent = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      };
  
      onStudentsChange([...students, newStudent]);
      setShowStudentList(true);
  
      // Show success message
      setSuccessAlert({ open: true, message: "Student added successfully!" });
  
      // Reset form
      setName("");
      setEmail("");
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
  
      // Use FileReader to read the file content
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
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
              results.data.forEach((row, index) => {
                // Find the name and email columns - be more flexible with column names
                const nameKey = Object.keys(row).find(
                  (key) => key.toLowerCase().includes("name")
                ) || Object.keys(row)[0]; // Default to first column if no name column
                
                const emailKey = Object.keys(row).find(
                  (key) => key.toLowerCase().includes("email")
                ) || Object.keys(row)[1]; // Default to second column if no email column
  
                if (!nameKey || !emailKey) {
                  throw new Error(
                    "CSV must contain at least two columns for name and email"
                  );
                }
  
                const name = row[nameKey]?.trim() || "";
                const email = row[emailKey]?.trim().toLowerCase() || "";
  
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
  
                if (emails.has(email)) {
                  throw new Error(
                    `Row ${index + 2}: Duplicate email: ${email}`
                  );
                }
  
                emails.add(email);
                validStudents.push({ name, email });
              });
  
              // Check for duplicates with existing students
              const newStudents = validStudents.filter(
                (newStudent) =>
                  !students.some(
                    (existingStudent) => existingStudent.email === newStudent.email
                  )
              );
  
              if (newStudents.length === 0) {
                setCsvError("No new students to add (all emails already exist)");
                return;
              }
  
              // Add new students to the list
              onStudentsChange([...students, ...newStudents]);
              setShowStudentList(true);
              
              // Show success message
              setSuccessAlert({ 
                open: true, 
                message: `${newStudents.length} students imported successfully!` 
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
  
    // Filter students based on search term
    const filteredStudents = students.filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                    CSV should include columns for name and email
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
                placeholder="Search recipients..."
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
                      secondary={student.email}
                    />
                  </ListItem>
                );
              })}
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