import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { Login, useLogin } from "react-admin";

const CustomLoginForm = () => {
	const [email, setEmail] = useState("");
	const [otp, setOtp] = useState("");
	const [step, setStep] = useState<"email" | "otp">("email");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const login = useLogin();

	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			await login({ email });
		} catch (err: unknown) {
			// Check if this is the expected "OTP_SENT" signal
			if (err instanceof Error && err.message === "OTP_SENT") {
				setStep("otp");
			} else {
				setError(err instanceof Error ? err.message : "An error occurred");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleOtpSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		try {
			await login({ email, otp });
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleBack = () => {
		setStep("email");
		setOtp("");
		setError(null);
	};

	return (
		<Box sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
			{step === "email" ? (
				<form onSubmit={handleEmailSubmit}>
					<Typography variant="h6" gutterBottom>
						Enter your email to receive OTP
					</Typography>
					<TextField
						label="Email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						fullWidth
						required
						margin="normal"
					/>
					{error && <Alert severity="error">{error}</Alert>}
					<Button
						type="submit"
						variant="contained"
						fullWidth
						disabled={loading}
						sx={{ mt: 2 }}
					>
						{loading ? "Sending..." : "Send OTP"}
					</Button>
				</form>
			) : (
				<form onSubmit={handleOtpSubmit}>
					<Typography variant="h6" gutterBottom>
						Enter the OTP sent to {email}
					</Typography>
					<TextField
						label="OTP"
						value={otp}
						onChange={(e) => setOtp(e.target.value)}
						fullWidth
						required
						margin="normal"
					/>
					{error && <Alert severity="error">{error}</Alert>}
					<Box sx={{ display: "flex", gap: 2, mt: 2 }}>
						<Button
							type="button"
							variant="outlined"
							onClick={handleBack}
							fullWidth
						>
							Back
						</Button>
						<Button
							type="submit"
							variant="contained"
							fullWidth
							disabled={loading}
						>
							{loading ? "Verifying..." : "Login"}
						</Button>
					</Box>
				</form>
			)}
		</Box>
	);
};

export const CustomLoginPage = () => (
	<Login>
		<CustomLoginForm />
	</Login>
);
