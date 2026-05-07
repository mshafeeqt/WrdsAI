import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

const tableHeaders = [
  "S.No",
  "First Name",
  "Last Name",
  "Email",
  "Mobile",
  "Plan Name",
  "Subscription Date",
  "Tokens Consumed",
  "Tokens Remaining",
  "Action",
];

export default function UserManagementPanel({
  allUsers,
  allUsersLoading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onAddUserClick,
  onDeleteUser,
}) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        overflow: "auto",
        p: { xs: 1, md: 3 },
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddUserClick}
          sx={{
            backgroundColor: "#2F67F6",
            textTransform: "none",
            borderRadius: 2,
            "&:hover": { backgroundColor: "#1e54d9" },
          }}
        >
          Add User
        </Button>
      </Box>
      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          borderRadius: 3,
          boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {allUsersLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: "75vh" }}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {tableHeaders.map((head) => (
                    <TableCell
                      key={head}
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#b7b8b9",
                        color: "#373232",
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {allUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => (
                    <TableRow
                      key={row._id}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{row.firstName}</TableCell>
                      <TableCell>{row.lastName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.mobile || "N/A"}</TableCell>
                      <TableCell>{row.subscriptionPlan}</TableCell>
                      <TableCell>
                        {row.planStartDate
                          ? new Date(row.planStartDate).toLocaleDateString("en-GB")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {row.tokensConsumed?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        {row.remainingTokens?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => onDeleteUser(row._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={allUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      </Paper>
    </Box>
  );
}
