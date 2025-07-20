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
  const [originalColumns, setOriginalColumns] = useState([]);
  const [emailColumn, setEmailColumn] = useState(null);
  const [nameColumn, setNameColumn] = useState(null);
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
  const [statusFilter, setStatusFilter] = useState("all");
  
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
    setOriginalColumns([]);
    setEmailColumn(null);
    setNameColumn(null);
    setSearchTerm("");
    setStatusFilter("all"); // Reset status filter
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
          const headers = results.meta.fields || [];
          setOriginalColumns(headers);
          
          // Find the name and email columns - be flexible with column names
          const nameKey = headers.find(
            (key) => key.toLowerCase().includes("name")
          ) || headers[0]; // Default to first column if no name column
          
          const emailKey = headers.find(
            (key) => key.toLowerCase().includes("email")
          ) || headers[1]; // Default to second column if no email column

          if (!nameKey || !emailKey) {
            throw new Error(
              "CSV must contain at least two columns for name and email"
            );
          }

          setNameColumn(nameKey);
          setEmailColumn(emailKey);

          const parsedData = results.data.map((row, index) => {
            const name = row[nameKey]?.trim() || "";
            const email = row[emailKey]?.trim().toLowerCase() || "";

            return {
              id: index,
              name,
              email,
              originalEmail: email,
              status: "pending", // pending, valid, fixable, invalid
              errorType: null,
              suggestion: null,
              originalRow: { ...row }, // Store the entire original row
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
    
    // Define comprehensive domain typos and their fixes
    const commonDomainTypos = {
      // Gmail variations
      'gmail.con': 'gmail.com',
      'gmail.co': 'gmail.com',
      'gmail.cm': 'gmail.com',
      'gmail.om': 'gmail.com',
      'gmail.c': 'gmail.com',
      'gmial.com': 'gmail.com',
      'gmai.com': 'gmail.com',
      'gamil.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'gmil.com': 'gmail.com',
      'gamail.com': 'gmail.com',
      'gmails.com': 'gmail.com',
      'gmail.coom': 'gmail.com',
      'gmail.comm': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'ggmail.com': 'gmail.com',
      'g-mail.com': 'gmail.com',
      'gmaio.com': 'gmail.com',
      'gmail.co.uk': 'gmail.com', // Common mistake
      'gmail.net': 'gmail.com',
      'gmail.org': 'gmail.com',
      
      // Yahoo variations
      'yahoo.con': 'yahoo.com',
      'yahoo.co': 'yahoo.com',
      'yahoo.cm': 'yahoo.com',
      'yahoo.om': 'yahoo.com',
      'yaho.com': 'yahoo.com',
      'yahooo.com': 'yahoo.com',
      'yahho.com': 'yahoo.com',
      'ymail.com': 'yahoo.com',
      'yahoo.coom': 'yahoo.com',
      'yahoo.comm': 'yahoo.com',
      'yahoo.net': 'yahoo.com',
      'yahoo.org': 'yahoo.com',
      'yhoo.com': 'yahoo.com',
      'yahoo.co.uk': 'yahoo.co.uk', // This is actually valid
      
      // Hotmail variations
      'hotmal.com': 'hotmail.com',
      'hotmial.com': 'hotmail.com',
      'hotmai.com': 'hotmail.com',
      'hotmail.con': 'hotmail.com',
      'hotmail.co': 'hotmail.com',
      'hotmail.cm': 'hotmail.com',
      'hotmil.com': 'hotmail.com',
      'hotmmail.com': 'hotmail.com',
      'homail.com': 'hotmail.com',
      'hotmail.coom': 'hotmail.com',
      'hotmail.comm': 'hotmail.com',
      'hotmail.net': 'hotmail.com',
      'hotmail.org': 'hotmail.com',
      
      // Outlook variations
      'outlok.com': 'outlook.com',
      'outloo.com': 'outlook.com',
      'outlook.co': 'outlook.com',
      'outlook.con': 'outlook.com',
      'outlook.cm': 'outlook.com',
      'outlook.om': 'outlook.com',
      'outlookk.com': 'outlook.com',
      'outllook.com': 'outlook.com',
      'outlook.coom': 'outlook.com',
      'outlook.comm': 'outlook.com',
      'outlook.net': 'outlook.com',
      'outlook.org': 'outlook.com',
      
      // Other common providers
      'aol.con': 'aol.com',
      'aol.co': 'aol.com',
      'comcast.net': 'comcast.net', // Valid
      'verizon.net': 'verizon.net', // Valid
      'att.net': 'att.net', // Valid
      'live.con': 'live.com',
      'live.co': 'live.com',
      'msn.con': 'msn.com',
      'msn.co': 'msn.com',
      'icloud.con': 'icloud.com',
      'icloud.co': 'icloud.com',
      'me.con': 'me.com',
      'me.co': 'me.com',
      
      // Generic TLD mistakes
      '.con': '.com',
      '.co': '.com',
      '.cm': '.com',
      '.om': '.com',
      '.coom': '.com',
      '.comm': '.com',
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
        const email = row.email.toLowerCase(); // Ensure email is lowercase
        
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
          // Try to guess where @ should be - improved logic
          if (email.includes('gmail') || email.includes('yahoo') || email.includes('hotmail') || 
              email.includes('outlook') || email.includes('aol') || email.includes('icloud')) {
            // Find common email providers and insert @ before them
            const providers = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
            for (const provider of providers) {
              const providerName = provider.split('.')[0]; // e.g., 'gmail'
              if (email.includes(providerName)) {
                const index = email.indexOf(providerName);
                if (index > 0) {
                  const username = email.substring(0, index);
                  const domain = email.substring(index);
                  // Check if domain needs .com added
                  if (!domain.includes('.')) {
                    suggestion = `${username}@${providerName}.com`;
                  } else {
                    suggestion = `${username}@${domain}`;
                  }
                  break;
                }
              }
            }
          } else {
            // Fallback to original logic for other cases
            const parts = email.split('.');
            if (parts.length >= 2) {
              suggestion = `${parts[0]}@${parts.slice(1).join('.')}`;
            }
          }
        } else if (!/.+@.+\..+/.test(email)) {
          isValid = false;
          errorType = "invalid_format";
        }
        
        // Check for spaces in email
        else if (/\s/.test(email)) {
          isValid = false;
          errorType = "contains_spaces";
          suggestion = email.replace(/\s+/g, '').toLowerCase();
        }
        
        // Check for multiple @ symbols
        else if ((email.match(/@/g) || []).length > 1) {
          isValid = false;
          errorType = "multiple_at";
          const parts = email.split('@');
          suggestion = `${parts[0]}@${parts.slice(1).join('')}`;
        }
        
        // Check for www in email (this is invalid in email addresses)
        else if (/www\./i.test(email)) {
          isValid = false;
          errorType = "contains_www";
          suggestion = email.replace(/www\./gi, '').toLowerCase();
        }
        
        // Check for common domain typos
        else {
          const parts = email.split('@');
          if (parts.length === 2) {
            const domain = parts[1]; // Already lowercase from above
            
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
            
            // Check for common TLD typos at the end
            else {
              let foundTldTypo = false;
              for (const [typo, correct] of Object.entries(commonDomainTypos)) {
                if (typo.startsWith('.') && domain.endsWith(typo)) {
                  isValid = false;
                  errorType = "tld_typo";
                  suggestion = `${parts[0]}@${domain.replace(new RegExp(typo.replace('.', '\\.') + '$'), correct)}`;
                  foundTldTypo = true;
                  break;
                }
              }
              
              // Additional sophisticated domain checking
              if (!foundTldTypo) {
                // Check for domains that are close to popular ones using Levenshtein-like comparison
                const popularDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
                
                for (const popularDomain of popularDomains) {
                  const distance = getEditDistance(domain, popularDomain);
                  // If the domain is very close to a popular one (1-2 character difference)
                  if (distance <= 2 && distance > 0) {
                    isValid = false;
                    errorType = "domain_similarity";
                    suggestion = `${parts[0]}@${popularDomain}`;
                    break;
                  }
                }
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
        updateStats(validatedData);
        
        setStatsDialog(true);
      }
    };
    
    // Start processing from the first batch
    processBatch(0);
  };

  // Helper function to calculate and update stats from current data
  const updateStats = (currentData) => {
    const validCount = currentData.filter(row => row.status === "valid").length;
    const fixableCount = currentData.filter(row => row.status === "fixable").length;
    const invalidCount = currentData.filter(row => row.status === "invalid").length;
    
    // Calculate common errors
    const commonErrors = {};
    currentData.forEach(row => {
      if (row.errorType) {
        if (!commonErrors[row.errorType]) {
          commonErrors[row.errorType] = 1;
        } else {
          commonErrors[row.errorType]++;
        }
      }
    });
    
    const newStats = {
      total: currentData.length,
      valid: validCount,
      fixable: fixableCount,
      invalid: invalidCount,
      commonErrors
    };
    
    setStats(newStats);
    return newStats;
  };

  // Simple edit distance function for domain similarity checking
  const getEditDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
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
        const email = editValue.trim().toLowerCase(); // Convert to lowercase
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
        
        // Update the original row data with the new email
        const updatedOriginalRow = { ...row.originalRow };
        if (emailColumn) {
          updatedOriginalRow[emailColumn] = email;
        }
        
        return {
          ...row,
          email,
          status,
          errorType,
          suggestion,
          originalRow: updatedOriginalRow
        };
      }
      return row;
    });
    
    setData(updatedData);
    updateStats(updatedData); // Update stats in real-time
    updateStats(updatedData); // Update stats in real-time
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
        // Ensure the suggestion is also lowercase
        const fixedEmail = row.suggestion.toLowerCase();
        
        // Update the original row data with the suggested email
        const updatedOriginalRow = { ...item.originalRow };
        if (emailColumn) {
          updatedOriginalRow[emailColumn] = fixedEmail;
        }
        
        return {
          ...item,
          email: fixedEmail,
          status: "valid",
          errorType: null,
          suggestion: null,
          originalRow: updatedOriginalRow
        };
      }
      return item;
    });
    
    setData(updatedData);
    updateStats(updatedData); // Update stats after fixing
  };

  const handleFixAll = () => {
    const updatedData = data.map(row => {
      if (row.status === "fixable" && row.suggestion) {
        // Ensure the suggestion is also lowercase
        const fixedEmail = row.suggestion.toLowerCase();
        
        // Update the original row data with the suggested email
        const updatedOriginalRow = { ...row.originalRow };
        if (emailColumn) {
          updatedOriginalRow[emailColumn] = fixedEmail;
        }
        
        return {
          ...row,
          email: fixedEmail,
          status: "valid",
          errorType: null,
          suggestion: null,
          originalRow: updatedOriginalRow
        };
      }
      return row;
    });
    
    setData(updatedData);
    updateStats(updatedData); // Update stats in real-time
    
    setSuccessMessage("Applied all suggested fixes");
    setAlertOpen(true);
  };

  const handleResetAll = () => {
    const originalDataCopy = JSON.parse(JSON.stringify(originalData));
    setData(originalDataCopy);
    validateEmails(originalDataCopy);
    
    setSuccessMessage("Reset to original data");
    setAlertOpen(true);
  };

  const handleDownload = () => {
    // Prepare data for download - preserve ALL original columns and update the email column
    const csvData = data.map(row => {
      const updatedRow = { ...row.originalRow };
      
      // Update the email column with the validated/fixed email
      if (emailColumn) {
        updatedRow[emailColumn] = row.email;
      }
      
      return updatedRow;
    });
    
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
    
    setSuccessMessage("CSV downloaded successfully with all original columns preserved");
    setAlertOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter data based on search term and status filter
  const filteredData = data.filter(row => {
    // Apply search filter
    const matchesSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.originalEmail && row.originalEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (row.status && row.status.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply status filter
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
      case "contains_www": return "Contains www (invalid in emails)";
      case "domain_typo": return "Domain typo";
      case "tld_typo": return "TLD typo (e.g., .con instead of .com)";
      case "domain_similarity": return "Domain similar to popular provider";
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
            Upload a CSV file with names and emails to validate and correct email addresses. All original columns will be preserved in the download.
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
                  CSV should include columns for name and email. All columns will be preserved.
                </T>
              </Bx>
            </Grid>
          </Grid>
          
          {/* Column Information */}
          {originalColumns.length > 0 && (
            <Bx sx={{ mb: 3 }}>
              <T variant="h6" gutterBottom>
                Detected Columns ({originalColumns.length})
              </T>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {originalColumns.map((column, index) => (
                  <Chip
                    key={index}
                    label={column}
                    color={column === emailColumn ? "primary" : column === nameColumn ? "secondary" : "default"}
                    variant={column === emailColumn || column === nameColumn ? "filled" : "outlined"}
                    size="small"
                  />
                ))}
              </Stack>
              <T variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Email column: <strong>{emailColumn}</strong> | Name column: <strong>{nameColumn}</strong>
              </T>
            </Bx>
          )}
          
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
                    clickable={stats.fixable > 0}
                    onClick={stats.fixable > 0 ? () => {
                      setStatusFilter("fixable");
                      setPage(0);
                      setSearchTerm("");
                    } : undefined}
                    sx={stats.fixable > 0 ? { cursor: 'pointer' } : {}}
                  />
                  <Chip 
                    icon={<ErrorIcon />}
                    label={`${stats.invalid} Invalid`}
                    color="error"
                    variant="outlined"
                    clickable={stats.invalid > 0}
                    onClick={stats.invalid > 0 ? () => {
                      setStatusFilter("invalid");
                      setPage(0);
                      setSearchTerm("");
                    } : undefined}
                    sx={stats.invalid > 0 ? { cursor: 'pointer' } : {}}
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
              
              {/* Status Filter Tabs */}
              <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
                <T variant="h6" gutterBottom>
                  Filter by Status
                </T>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <B
                    variant={statusFilter === "all" ? "contained" : "outlined"}
                    onClick={() => {
                      setStatusFilter("all");
                      setPage(0); // Reset to first page when filtering
                    }}
                    size="small"
                  >
                    All ({stats.total})
                  </B>
                  <B
                    variant={statusFilter === "valid" ? "contained" : "outlined"}
                    color="success"
                    onClick={() => {
                      setStatusFilter("valid");
                      setPage(0);
                    }}
                    size="small"
                    disabled={stats.valid === 0}
                  >
                    Valid ({stats.valid})
                  </B>
                  <B
                    variant={statusFilter === "fixable" ? "contained" : "outlined"}
                    color="warning"
                    onClick={() => {
                      setStatusFilter("fixable");
                      setPage(0);
                      if (stats.fixable > 0) {
                        setSearchTerm(""); // Clear search to show all fixable emails
                      }
                    }}
                    size="small"
                    disabled={stats.fixable === 0}
                  >
                    Fixable ({stats.fixable})
                  </B>
                  <B
                    variant={statusFilter === "invalid" ? "contained" : "outlined"}
                    color="error"
                    onClick={() => {
                      setStatusFilter("invalid");
                      setPage(0);
                      if (stats.invalid > 0) {
                        setSearchTerm(""); // Clear search to show all invalid emails
                      }
                    }}
                    size="small"
                    disabled={stats.invalid === 0}
                  >
                    Invalid ({stats.invalid})
                  </B>
                </Stack>
                <T variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {statusFilter === "all" 
                    ? `Showing all ${filteredData.length} emails`
                    : `Showing ${filteredData.length} ${statusFilter} emails`
                  }
                  {searchTerm && ` matching "${searchTerm}"`}
                </T>
              </Paper>
              
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
                            {searchTerm 
                              ? `No ${statusFilter === "all" ? "" : statusFilter + " "}emails matching "${searchTerm}"`
                              : statusFilter === "all" 
                                ? "No data available"
                                : `No ${statusFilter} emails found`
                            }
                          </T>
                          {statusFilter !== "all" && (
                            <T variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              <B 
                                variant="text" 
                                size="small" 
                                onClick={() => setStatusFilter("all")}
                                sx={{ textTransform: 'none' }}
                              >
                                Show all emails
                              </B>
                            </T>
                          )}
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
                      {errorType === "contains_www" && "Email contains 'www' which is invalid in email addresses"}
                      {errorType === "domain_typo" && "Common typo in email domain (e.g., gmail.con instead of gmail.com)"}
                      {errorType === "tld_typo" && "Common typo in top-level domain (e.g., .con instead of .com)"}
                      {errorType === "domain_similarity" && "Domain is similar to a popular email provider"}
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