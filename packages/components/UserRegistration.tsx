import React from "react"
import { Box, Button, CircularProgress, Grid, Paper, TextField, Typography } from "@mui/material"
import { useUserAuth } from "contexts/UserAuthContext"
import { green } from "@mui/material/colors"

export interface UserRegistrationProps {
    onSuccess: () => void
    onError: (message: string) => void
}

const UserRegistration = (props: UserRegistrationProps) => {
    const userAuth = useUserAuth()

    const [username, setUsername] = React.useState<string>('')
    const [password, setPassword] = React.useState<string>('')
    const [vpassword, setVPassword] = React.useState<string>('')
    const [loading, setLoading] = React.useState<boolean>(false)

    const updateUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value)
    }
    const updatePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
    }
    const updateVPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVPassword(e.target.value)
    }

    const assertForm = () => {
        if (password !== vpassword) throw new Error('Passwords do not match')
        if (!username) throw new Error('Username is required')
        if (!password) throw new Error('Password is required')
        if (password.length < 12) throw new Error('Password must be at least 12 characters')
    }

    const submit = async (e: React.MouseEvent) => {
        e.preventDefault()
        try {
            assertForm()
            setLoading(true)
            userAuth.register(username, password).then((success: boolean) => {
                if (success) {
                    props.onSuccess()
                } else {
                    throw new Error('Registration failed')
                }
            })
        } catch (e) {
            if (e instanceof Error) {
                console.error(e.message)
                props.onError(e.message)
            } else {
                console.error('Unknown error')
                props.onError('Unknown error')
            }
        }

    }


    return (
        <Paper sx={{ p: 6 }} elevation={0}>
            <Grid
                container
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
            >
                <Grid lg={5}>
                    <Paper sx={{ p: 4 }} elevation={0}>
                        <Typography variant="body1" sx={{ color: '#6e6e6e', fontWeight: 600 }}>
                            Username
                        </Typography>
                        <TextField value={username} onChange={updateUsername} size={'small'} fullWidth sx={{ mt: 2, mb: 2 }} name={'username'} />
                        <Typography variant="body1" sx={{ color: '#6e6e6e', fontWeight: 600 }}>
                            Password
                        </Typography>
                        <TextField value={password} onChange={updatePassword} size={'small'} type={'password'} fullWidth sx={{ mt: 2, mb: 2 }} name={'password'} />
                        <Typography variant="body1" sx={{ color: '#6e6e6e', fontWeight: 600 }}>
                            Verify Password
                        </Typography>
                        <TextField value={vpassword} onChange={updateVPassword} error={password !== vpassword} size={'small'} type={'password'} fullWidth sx={{ mt: 2, mb: 2 }} name={'vpassword'} />
                        <Box sx={{ m: 1, position: 'relative' }}>
                            <Button disabled={loading} id={'sign-up-button'} onClick={submit} variant="outlined" size="large" sx={{ mt: 3, mb: 3, width: '100%' }}>Sign Up</Button>
                            {loading && (
                                <CircularProgress
                                    size={24}
                                    sx={{
                                        color: green[500],
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        marginTop: '-12px',
                                        marginLeft: '-12px',
                                    }}
                                />
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Paper>
    )
}

export default UserRegistration