import {
    Box as Bx,
    Container,
    Typography as T,
    Paper,
    Button as B,
    Grid,
    Stack,
    Alert,
    LinearProgress,
    TextField as Tf,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    Tooltip,
    Snackbar,
    CircularProgress,
  } from "@mui/material";
  import {
    Upload,
    CloudUpload,
    CheckCircle,
    Error as ErrorIcon,
    Download,
    Edit,
    Save,
    Search,
    Delete,
    Check,
    Error,
    RestartAlt,
    Warning,
    Info,
  } from "@mui/icons-material";
  import { useState, useRef, useEffect } from "react";
  import Papa from "papaparse";
  import Appbar from "../../components/Appbar";
  import { useUser } from "../../contexts/UserProvider";
  import Loading from "../../components/Loading";
  
  export default function EmailValidatorPage() {
    const { isAdmin, uloading } = useUser();
    const [file, setFile] = useState(null);
    const [data, setData] = useState([]);
    const [originalData, setOriginalData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [validated, setValidated] = useState(false);
    const [progress, setProgress] = useState(0);
    const [errors, setErrors] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingRow, setEditingRow] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [successMessage, setSuccessMessage] = useState("");
    const [alertOpen, setAlertOpen] = useState(false);
    const [statsDialog, setStatsDialog] = useState(false);
    const [stats, setStats] = useState({
      total: 0,
      valid: 0,
      fixable: 0,
      invalid: 0,
      commonErrors: {}
    });
    
    const fileInputRef = useRef(null);
  
    // Show loading state while user authentication is being checked
    if (uloading) {
      return <Loading text="Checking authorization..." />;
    }
  
    // Check if user is admin
    if (!isAdmin) {
      return (
        <Container>
          <Appbar />
          <Bx sx={{ p: 3, textAlign: "center" }}>
            <T color="error" variant="h6">You are not authorized to access this page.</T>
          </Bx>
        </Container>
      );
    }
  
    const handleFileSelect = () => {
      fileInputRef.current.click();
    };
  
    const handleFileUpload = (event) => {
      const selectedFile = event.target.files[0];
      if (!selectedFile) return;
  
      setFile(selectedFile);
      setLoading(true);
      setValidated(false);
      setErrors([]);
      setData([]);
      setOriginalData([]);
      setSearchTerm("");
      setPage(0);
  
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setLoading(false);
          
          if (results.errors.length > 0) {
            setErrors([{
              type: "parse_error",
              message: `CSV parsing error: ${results.errors[0].message}`
            }]);
            return;
          }
  
          // Process the data
          try {
            const parsedData = results.data.map((row, index) => {
              // Find the name and email columns - be flexible with column names
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
              const email = row[emailKey]?.trim() || "";
  
              return {
                id: index,
                name,
                email,
                originalEmail: email,
                status: "pending", // pending, valid, fixable, invalid
                errorType: null,
                suggestion: null,
              };
            });
  
            setData(parsedData);
            setOriginalData(JSON.parse(JSON.stringify(parsedData)));
            
            // Validate emails after a short delay
            setTimeout(() => validateEmails(parsedData), 300);
          } catch (error) {
            setErrors([{
              type: "process_error",
              message: `Error processing CSV: ${error.message}`
            }]);
          }
        },
        error: (error) => {
          setLoading(false);
          setErrors([{
            type: "file_error",
            message: `Error reading CSV file: ${error.message}`
          }]);
        }
      });
  
      // Reset file input
      event.target.value = null;
    };
  
    const validateEmails = (dataToValidate) => {
      setValidating(true);
      setProgress(0);
      
      // Define common email validation issues and their fixes
      const commonDomainTypos = {
        'gmail.con': 'gmail.com',
        'gmial.com': 'gmail.com',
        'gamil.com': 'gmail.com',
        'gmail.co': 'gmail.com',
        'gmal.com': 'gmail.com',
        'gmail.cm': 'gmail.com',
        'yahoo.con': 'yahoo.com',
        'yaho.com': 'yahoo.com',
        'yahooo.com': 'yahoo.com',
        'ymail.com': 'yahoo.com',
        'hotmal.com': 'hotmail.com',
        'hotmial.com': 'hotmail.com',
        'hotmai.com': 'hotmail.com',
        'hotmail.con': 'hotmail.com',
        'outlok.com': 'outlook.com',
        'outloo.com': 'outlook.com',
        'outlook.co': 'outlook.com',
        'outlook.con': 'outlook.com'
      };
  
      // Create batch processing for large files
      const batchSize = 100;
      const totalRows = dataToValidate.length;
      let processedRows = 0;
      const validatedData = [...dataToValidate];
      const errorStats = { commonErrors: {} };
  
      // Process emails in batches to prevent UI freezing
      const processBatch = (startIndex) => {
        const endIndex = Math.min(startIndex + batchSize, totalRows);
        
        for (let i = startIndex; i < endIndex; i++) {
          const row = validatedData[i];
          const email = row.email;
          
          // Skip empty emails
          if (!email) {
            row.status = "invalid";
            row.errorType = "empty";
            row.suggestion = null;
            
            if (!errorStats.commonErrors["empty"]) {
              errorStats.commonErrors["empty"] = 1;
            } else {
              errorStats.commonErrors["empty"]++;
            }
            
            continue;
          }
  
          let isValid = true;
          let errorType = null;
          let suggestion = null;
  
          // Check basic email format (has @ and .)
          if (!/@/.test(email)) {
            isValid = false;
            errorType = "missing_at";
            // Try to guess where @ should be
            const parts = email.split('.');
            if (parts.length >= 2) {
              suggestion = `${parts[0]}@${parts.slice(1).join('.')}`;
            }
          } else if (!/.+@.+\..+/.test(email)) {
            isValid = false;
            errorType = "invalid_format";
          }
          
          // Check for spaces in email
          else if (/\s/.test(email)) {
            isValid = false;
            errorType = "contains_spaces";
            suggestion = email.replace(/\s+/g, '');
          }
          
          // Check for multiple @ symbols
          else if ((email.match(/@/g) || []).length > 1) {
            isValid = false;
            errorType = "multiple_at";
            const parts = email.split('@');
            suggestion = `${parts[0]}@${parts.slice(1).join('')}`;
          }
          
          // Check for common domain typos
          else {
            const parts = email.split('@');
            if (parts.length === 2) {
              const domain = parts[1].toLowerCase();
              
              if (commonDomainTypos[domain]) {
                isValid = false;
                errorType = "domain_typo";
                suggestion = `${parts[0]}@${commonDomainTypos[domain]}`;
              }
              
              // Check for missing or wrong TLD
              else if (!/.+\..{2,}$/.test(domain)) {
                isValid = false;
                errorType = "invalid_tld";
                
                // Try to fix missing dot in domain
                if (!domain.includes('.')) {
                  // Guess common TLDs
                  suggestion = `${parts[0]}@${domain}.com`;
                }
              }
            }
          }
          
          // Update row status
          if (isValid) {
            row.status = "valid";
          } else {
            row.status = suggestion ? "fixable" : "invalid";
            row.errorType = errorType;
            row.suggestion = suggestion;
            
            // Track error stats
            if (!errorStats.commonErrors[errorType]) {
              errorStats.commonErrors[errorType] = 1;
            } else {
              errorStats.commonErrors[errorType]++;
            }
          }
        }
        
        processedRows += (endIndex - startIndex);
        const currentProgress = Math.floor((processedRows / totalRows) * 100);
        setProgress(currentProgress);
        
        if (processedRows < totalRows) {
          // Process next batch
          setTimeout(() => processBatch(endIndex), 0);
        } else {
          // Finished processing
          setData(validatedData);
          setValidating(false);
          setValidated(true);
          
          // Compute final stats
          const validCount = validatedData.filter(row => row.status === "valid").length;
          const fixableCount = validatedData.filter(row => row.status === "fixable").length;
          const invalidCount = validatedData.filter(row => row.status === "invalid").length;
          
          setStats({
            total: totalRows,
            valid: validCount,
            fixable: fixableCount,
            invalid: invalidCount,
            commonErrors: errorStats.commonErrors
          });
          
          setStatsDialog(true);
        }
      };
      
      // Start processing from the first batch
      processBatch(0);
    };
  
    const handleEdit = (row) => {
      setEditingRow(row.id);
      setEditValue(row.email);
    };
  
    const handleSaveEdit = () => {
      if (editingRow === null) return;
      
      const updatedData = data.map(row => {
        if (row.id === editingRow) {
          // Check validity of the new email
          const email = editValue.trim();
          let status = "valid";
          let errorType = null;
          let suggestion = null;
          
          if (!email) {
            status = "invalid";
            errorType = "empty";
          } else if (!/@/.test(email)) {
            status = "invalid";
            errorType = "missing_at";
          } else if (!/.+@.+\..+/.test(email)) {
            status = "invalid";
            errorType = "invalid_format";
          }
          
          return {
            ...row,
            email,
            status,
            errorType,
            suggestion
          };
        }
        return row;
      });
      
      setData(updatedData);
      setEditingRow(null);
      setEditValue("");
    };
  
    const handleCancelEdit = () => {
      setEditingRow(null);
      setEditValue("");
    };
  
    const handleFixSuggestion = (row) => {
      if (!row.suggestion) return;
      
      const updatedData = data.map(item => {
        if (item.id === row.id) {
          return {
            ...item,
            email: row.suggestion,
            status: "valid",
            errorType: null,
            suggestion: null
          };
        }
        return item;
      });
      
      setData(updatedData);
    };
  
    const handleFixAll = () => {
      const updatedData = data.map(row => {
        if (row.status === "fixable" && row.suggestion) {
          return {
            ...row,
            email: row.suggestion,
            status: "valid",
            errorType: null,
            suggestion: null
          };
        }
        return row;
      });
      
      setData(updatedData);
      
      setSuccessMessage("Applied all suggested fixes");
      setAlertOpen(true);
    };
  
    const handleResetAll = () => {
      setData(JSON.parse(JSON.stringify(originalData)));
      validateEmails(originalData);
      
      setSuccessMessage("Reset to original data");
      setAlertOpen(true);
    };
  
    const handleDownload = () => {
      // Prepare data for download (convert back to format with just name and email)
      const csvData = data.map(row => ({
        name: row.name,
        email: row.email
      }));
      
      // Convert to CSV
      const csv = Papa.unparse(csvData);
      
      // Create a download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `validated_emails_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMessage("CSV downloaded successfully");
      setAlertOpen(true);
    };
  
    const handleChangePage = (event, newPage) => {
      setPage(newPage);
    };
  
    const handleChangeRowsPerPage = (event) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };
  
    // Filter data based on search term
    const filteredData = data.filter(row => 
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.originalEmail && row.originalEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.status && row.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  
    // Calculate pagination
    const paginatedData = filteredData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  
    const getErrorLabel = (errorType) => {
      switch(errorType) {
        case "missing_at": return "Missing @ symbol";
        case "invalid_format": return "Invalid email format";
        case "contains_spaces": return "Contains spaces";
        case "multiple_at": return "Multiple @ symbols";
        case "domain_typo": return "Domain typo";
        case "invalid_tld": return "Invalid/missing domain extension";
        case "empty": return "Empty email";
        default: return "Unknown error";
      }
    };
  
    // Get color for status chip
    const getStatusColor = (status) => {
      switch(status) {
        case "valid": return "success";
        case "fixable": return "warning";
        case "invalid": return "error";
        default: return "default";
      }
    };
  
    // Get icon for status chip
    const getStatusIcon = (status) => {
      switch(status) {
        case "valid": return <CheckCircle fontSize="small" />;
        case "fixable": return <Warning fontSize="small" />;
        case "invalid": return <ErrorIcon fontSize="small" />;
        default: return <Info fontSize="small" />;
      }
    };
  
    return (
      <Container
        disableGutters
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#f4f4f4",
        }}
      >
        <Appbar />
        
        <Bx sx={{ p: 3 }}>
          <Paper sx={{ p: 4, mb: 4, borderRadius: 2 }}>
            <T variant="h4" gutterBottom>
              Email Validator
            </T>
            <T variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Upload a CSV file with names and emails to validate and correct email addresses.
            </T>
            
            {/* File Upload Section */}
            <Grid container spacing={3}>
              <Grid item xs={12}>
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
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "rgba(76, 175, 80, 0.05)",
                      borderColor: "primary.dark",
                    },
                    mb: 3
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
              </Grid>
            </Grid>
            
            {/* Loading Indicator */}
            {loading && (
              <Bx sx={{ mt: 2 }}>
                <T variant="body2" color="text.secondary" align="center" gutterBottom>
                  Loading CSV file...
                </T>
                <LinearProgress />
              </Bx>
            )}
            
            {/* Validation Progress */}
            {validating && (
              <Bx sx={{ mt: 2 }}>
                <T variant="body2" color="text.secondary" align="center" gutterBottom>
                  Validating emails: {progress}%
                </T>
                <LinearProgress variant="determinate" value={progress} />
              </Bx>
            )}
            
            {/* Error Messages */}
            {errors.length > 0 && (
              <Stack spacing={2} sx={{ mt: 3 }}>
                {errors.map((error, index) => (
                  <Alert key={index} severity="error">
                    {error.message}
                  </Alert>
                ))}
              </Stack>
            )}
            
            {/* Results Section */}
            {validated && data.length > 0 && (
              <Bx sx={{ mt: 4 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2}>
                    <Chip 
                      icon={<CheckCircle />}
                      label={`${stats.valid} Valid`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<Warning />}
                      label={`${stats.fixable} Fixable`}
                      color="warning"
                      variant="outlined"
                    />
                    <Chip 
                      icon={<ErrorIcon />}
                      label={`${stats.invalid} Invalid`}
                      color="error"
                      variant="outlined"
                    />
                  </Stack>
                  
                  <Stack direction="row" spacing={2}>
                    <B
                      variant="outlined"
                      startIcon={<Info />}
                      onClick={() => setStatsDialog(true)}
                    >
                      View Stats
                    </B>
                    <B
                      variant="outlined"
                      startIcon={<RestartAlt />}
                      onClick={handleResetAll}
                    >
                      Reset
                    </B>
                    <B
                      variant="contained"
                      color="warning"
                      startIcon={<Check />}
                      onClick={handleFixAll}
                      disabled={stats.fixable === 0}
                    >
                      Fix All
                    </B>
                    <B
                      variant="contained"
                      color="primary"
                      startIcon={<Download />}
                      onClick={handleDownload}
                    >
                      Download CSV
                    </B>
                  </Stack>
                </Stack>
                
                {/* Search Box */}
                <Tf
                  fullWidth
                  placeholder="Search by name, email or status..."
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                
                {/* Results Table */}
                <TableContainer component={Paper} variant="outlined">
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.default' }}>
                        <TableCell>#</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Original Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.map((row, index) => (
                        <TableRow key={row.id} sx={{
                          bgcolor: row.status === 'invalid' ? 'rgba(244, 67, 54, 0.05)' :
                                  row.status === 'fixable' ? 'rgba(255, 152, 0, 0.05)' : 
                                  'inherit'
                        }}>
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>
                            {editingRow === row.id ? (
                              <Tf
                                fullWidth
                                variant="outlined"
                                size="small"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton size="small" onClick={handleSaveEdit}>
                                        <Save fontSize="small" />
                                      </IconButton>
                                      <IconButton size="small" onClick={handleCancelEdit}>
                                        <Delete fontSize="small" />
                                      </IconButton>
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            ) : (
                              row.email
                            )}
                          </TableCell>
                          <TableCell>
                            {row.email !== row.originalEmail ? (
                              <T variant="body2" color="text.secondary">
                                {row.originalEmail}
                              </T>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={row.errorType ? getErrorLabel(row.errorType) : ''}>
                              <Chip
                                icon={getStatusIcon(row.status)}
                                label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                size="small"
                                color={getStatusColor(row.status)}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {row.status === "fixable" && (
                                <Tooltip title={`Apply suggestion: ${row.suggestion}`}>
                                  <IconButton 
                                    size="small" 
                                    color="warning"
                                    onClick={() => handleFixSuggestion(row)}
                                  >
                                    <Check fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Edit email">
                                <IconButton 
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEdit(row)}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {paginatedData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <T variant="body1" color="text.secondary">
                              {searchTerm ? "No matching results" : "No data available"}
                            </T>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  component="div"
                  count={filteredData.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </Bx>
            )}
          </Paper>
        </Bx>
        
        {/* Statistics Dialog */}
        <Dialog
          open={statsDialog}
          onClose={() => setStatsDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Email Validation Statistics</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CheckCircle sx={{ fontSize: 40, mb: 1 }} />
                  <T variant="h5">{stats.valid}</T>
                  <T variant="body2">Valid Emails</T>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                  <Warning sx={{ fontSize: 40, mb: 1 }} />
                  <T variant="h5">{stats.fixable}</T>
                  <T variant="body2">Fixable Emails</T>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                  <ErrorIcon sx={{ fontSize: 40, mb: 1 }} />
                  <T variant="h5">{stats.invalid}</T>
                  <T variant="body2">Invalid Emails</T>
                </Paper>
              </Grid>
            </Grid>
            
            <T variant="h6" sx={{ mt: 4, mb: 2 }}>Common Error Types</T>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Error Type</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(stats.commonErrors).map(([errorType, count]) => (
                    <TableRow key={errorType}>
                      <TableCell>{getErrorLabel(errorType)}</TableCell>
                      <TableCell>{count}</TableCell>
                      <TableCell>
                        {errorType === "missing_at" && "Email is missing the @ symbol"}
                        {errorType === "invalid_format" && "Email format is invalid (missing domain or username)"}
                        {errorType === "contains_spaces" && "Email contains whitespace characters"}
                        {errorType === "multiple_at" && "Email contains multiple @ symbols"}
                        {errorType === "domain_typo" && "Common typo in email domain (e.g., gmail.con instead of gmail.com)"}
                        {errorType === "invalid_tld" && "Invalid or missing top-level domain (e.g., .com, .org)"}
                        {errorType === "empty" && "Email field is empty"}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {Object.keys(stats.commonErrors).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <T variant="body2" color="text.secondary">No errors found</T>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <B onClick={() => setStatsDialog(false)}>Close</B>
          </DialogActions>
        </Dialog>
        
        {/* Success Snackbar */}
        <Snackbar
          open={alertOpen}
          autoHideDuration={4000}
          onClose={() => setAlertOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setAlertOpen(false)} 
            severity="success"
            variant="filled"
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Container>
    );
  }