import { Container, Grid, Box, Skeleton, Paper } from "@mui/material";

export default function SettingsLoading() {
  return (
    <Container maxWidth="lg" sx={{ minHeight: "100vh", py: 4 }}>
      <Grid container spacing={4}>
        {/* Sidebar Skeleton */}
        <Grid
          size={{ xs: 12, lg: 3 }}
          sx={{
            display: { xs: "none", lg: "block" },
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 3,
              backgroundColor: "var(--color-secondary-bg)",
              backgroundImage: "none",
              border: "1px solid var(--color-border-primary)",
            }}
          >
            <Skeleton
              variant="text"
              width="60%"
              height={32}
              sx={{ mb: 2, mx: 2 }}
            />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Box key={i} sx={{ px: 2, py: 1.5 }}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={36}
                  sx={{ borderRadius: 2 }}
                />
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Content Skeleton */}
        <Grid size={{ xs: 12, lg: 9 }}>
          {[1, 2, 3].map((i) => (
            <Paper
              key={i}
              elevation={1}
              sx={{
                mb: 4,
                p: 3,
                backgroundColor: "var(--color-secondary-bg)",
                borderRadius: 3,
                backgroundImage: "none",
                border: "1px solid var(--color-border-primary)",
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
              >
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="text" width="40%" height={40} />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[1, 2, 3].map((j) => (
                  <Box key={j}>
                    <Skeleton
                      variant="text"
                      width="30%"
                      height={28}
                      sx={{ mb: 1 }}
                    />
                    <Skeleton
                      variant="text"
                      width="80%"
                      height={20}
                      sx={{ mb: 2 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={44}
                      height={24}
                      sx={{ borderRadius: 10 }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>
          ))}
        </Grid>
      </Grid>
    </Container>
  );
}
