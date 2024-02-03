import React from "react"
import { Avatar, Button, Fade, FormControl, Grid, IconButton, InputAdornment, LinearProgress, OutlinedInput, Paper, Typography } from "@mui/material";
import { useWallet } from "../../../core/src/contexts/VaultContext/WalletContext";
import { useAuth } from "../../../core/src/contexts/AuthContext/AuthContext";
import * as __ from 'lib384/dist/384.esm'
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { VisibilityOff, Visibility } from "@mui/icons-material";
import SwipeableViews from 'react-swipeable-views';
import { useSnackabra } from "contexts/SnackabraContext";
import { ChannelStoreType } from "stores/Channel.Store";


const Login = () => {
    const auth = useAuth()
    const wallet = useWallet()
    const snackabra = useSnackabra()
    const [controlMessages, setControlMessages] = React.useState<ChannelStoreType['messages']>([])
    const [messages, setMessages] = React.useState<ChannelStoreType['messages']>([])
    const [channel, setChannel] = React.useState<ChannelStoreType>(undefined as unknown as ChannelStoreType)
    const [openSecret, setOpenSecret] = React.useState<boolean>(false);
    const [note, setNote] = React.useState<string>('')
    const [importedWalletId, setImportedWalletId] = React.useState<string | undefined>(undefined)
    const [warning, setWarning] = React.useState<string>('')
    const [pin, setPin] = React.useState<string[]>(['', '', '', ''])
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [activeStep, setActiveStep] = React.useState(0);

    React.useEffect(() => {
        if (wallet.id) {
            loadWallet();
        }
    }, [wallet.id])

    const onMessage = React.useCallback((msgs: ChannelStoreType['messages']) => {
        for (let x in msgs) {
            const msg = msgs[x]
            if (msg.hasOwnProperty('verificationToken')) {
                setControlMessages(_oldContorlMessages => [..._oldContorlMessages, msg])
            } else {
                setMessages(_oldMessages => [..._oldMessages, msg])
            }
        }
    }, [controlMessages, messages])

    React.useEffect(() => {
        if (channel) {
            onMessage(channel.messages)
        }
    }, [channel, channel.messages])

    const loadWallet = async () => {
        console.log('wallet loaded')
        if (!snackabra) throw new Error('Snackabra not loaded, this should not happen.')
        if (!wallet.identity) throw new Error('Wallet identity not loaded, this should not happen.')
        try {
            const c = snackabra.getChannel(wallet.identity)
            c.connect()
            setChannel(c)
        } catch (e) {
            if (e instanceof Error)
                console.error(e.message)
        }

    }

    const handleNext = async () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        try {
            if (!snackabra) throw new Error('Snackabra not loaded, this should not happen.')
            if (pin.join('').trim().length !== 16) {
                setError(true)
                return
            }
            setError(false)
            const jwk = await auth.setPassPhrase(pin.join(' ').trim())
            const sb384 = new __.NewSB.SB384(jwk)
            await sb384.ready
            const _wallet = { key: jwk, channelId: sb384.hash }
            await snackabra.joinChannel(
                sb384.hash,
                jwk,

            );
            auth.setAfterAuth(JSON.stringify(_wallet))
        } catch (e) {
            alert('That didn\'t work, let\'s try again.')
            handleBack()
            console.error(e)
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleButtonClick = async () => {
        if (!loading) {
            setSuccess(false);
            setError(false);
            setLoading(true);
            setImportedWalletId(pin.join(' ').trim())
            handleNext()
        }
    };

    function chunkIntoSets(str: string): string[] {
        const sets = [];
        let currentSet = "";

        for (let i = 0; i < str.length; i++) {
            currentSet += str[i];
            if (currentSet.length === 4 || i === str.length - 1) {
                sets.push(currentSet);
                currentSet = "";
            }
        }

        return sets;
    }

    const validatePin = (pin: string[]): string[] => {
        for (let x in pin) {
            if (pin[x].length === 4) {
                const processed = __.crypto.strongpin.process(pin[x])
                console.log(processed)
                if (processed !== pin[x]) {
                    pin[x] = processed
                    setWarning('We detected a typo in your pin, we fixed it for you. But, you should double check your pin.')
                }
            }
        }
        return pin
    }

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter' && pin.join('').trim().length === 16) {
            handleButtonClick()
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value.replace(/ /g, '')
        if (value.length > 16) return
        const _pin = chunkIntoSets(value)
        setPin(validatePin(_pin))
    }


    return (
        <Grid
            container
            direction="column"
            justifyContent="center"
            alignItems="center"
            spacing={2}
            sx={{ padding: '0px 24px', height: '100vh', background: 'none' }}
        >
            <Paper sx={{ p: 3, width: 360 }}>
                <Grid
                    container
                    direction="column"
                    justifyContent="center"
                    alignItems="center"
                    spacing={2}
                >
                    <Typography variant="h2" align="center">
                        384 Inc
                    </Typography>
                    <Typography variant="h5" align="center">
                        Login
                    </Typography>
                    <Grid item>
                        <Avatar
                            alt="Account Image"
                            sx={{ width: 56, height: 56 }}
                        >
                            <AccountCircleIcon sx={{ fontSize: 64 }} />
                        </Avatar>
                    </Grid>
                    <Grid item>
                        <SwipeableViews style={{ padding: 0 }} index={activeStep}>
                            <FormControl sx={{ m: 1, width: '100%', ml: 0, mr: 0 }} variant="outlined">
                                <OutlinedInput
                                    id="outlined-adornment-password"
                                    type={showPassword ? 'text' : 'password'}
                                    size="small"
                                    error={error}
                                    sx={{ pr: 0 }}
                                    value={pin.join(' ').trim() !== '' ? pin.join(' ') : ''}
                                    onChange={handleChange}
                                    onKeyUp={handleKeyUp}
                                    autoFocus
                                    autoComplete="off"
                                    endAdornment={
                                        <InputAdornment
                                            position="end">
                                            <IconButton
                                                sx={{ mr: 1 }}
                                                aria-label="toggle password visibility"
                                                onClick={handleClickShowPassword}
                                                onMouseDown={handleMouseDownPassword}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                            <Button
                                                style={{ borderRadius: '0px 4px 4px 0px' }}
                                                variant={'contained'} onClick={handleNext}>Next</Button>
                                        </InputAdornment>
                                    }
                                />
                            </FormControl>
                            <Grid
                                justifyContent={'center'}
                                alignItems={'center'}
                                container>
                                <Grid item>
                                    <IconButton
                                        sx={{ mr: 1 }}
                                        aria-label="go back to strongpin"
                                        onClick={handleBack}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        <ArrowBackIcon />
                                    </IconButton>
                                </Grid>
                                <Grid xs={10} item>
                                    <LinearProgress color="inherit" />
                                </Grid>
                            </Grid>

                        </SwipeableViews>
                    </Grid>
                    <Fade in={warning !== ''}>
                        <Grid item>
                            <Typography variant="subtitle2" align="center" color={'#ff7961'}>{warning}</Typography>
                        </Grid>
                    </Fade>
                </Grid>
            </Paper>

        </Grid>
    )
}

export default Login;


