import React from "react"
import { Box, Button, CircularProgress, Grid, Paper, TextField, Typography } from "@mui/material"
import { useUserAuth } from "contexts/UserAuthContext"
import { green } from "@mui/material/colors";

export interface UserLoginProps {
    onSuccess: () => void
    onError: (message: string) => void
}

const UserLogin = (props: UserLoginProps) => {
    const userAuth = useUserAuth()
    const [username, setUsername] = React.useState<string>('')
    const [password, setPassword] = React.useState<string>('')
    const [loading, setLoading] = React.useState<boolean>(false)

    React.useEffect(() => {
        props.onSuccess()
    }, [userAuth.isLoggedIn])


    const updateUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(e.target.value)
    }
    const updatePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
    }

    const performLogin = async (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault()
        console.log('performing login')
        try {
            userAuth.login(username, password)
        } catch (e) {
            if (e instanceof Error) {
                console.error(e)
                props.onError(e.message)
            } else {
                console.error('Unknown error')
                props.onError('Unknown error')
            }
        }

    }

    const submitFormByKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            performLogin(e)
        }
    }

    return (

        <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
        >
            <Grid lg={5}>
                <Paper sx={{ p: 4 }} elevation={0}>
                    <Typography variant="h2">Login</Typography>
                    <Typography variant="body1">
                        Username
                    </Typography>
                    <TextField onKeyUp={submitFormByKey} value={username} onChange={updateUsername} size={'small'} fullWidth sx={{ mt: 2, mb: 2 }} name={'email'} id={'email'} />
                    <Typography variant="body1">
                        Password
                    </Typography>
                    <TextField onKeyUp={submitFormByKey} value={password} onChange={updatePassword} size={'small'} type={'password'} fullWidth sx={{ mt: 2, mb: 2 }} name={'password'} id={'password'} />
                    <Box sx={{ m: 1, position: 'relative' }}>
                        <Button disabled={loading} id={'submit'} onClick={performLogin} variant="outlined" size="large" sx={{ mt: 3, mb: 3, width: '100%' }}>Sign In</Button>
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
    )
}

export default UserLogin