/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from "react"
import { Avatar, Button, Fade, FormControl, Grid, IconButton, InputAdornment, LinearProgress, OutlinedInput, Paper, Typography } from "@mui/material";
import * as __ from 'lib384/dist/384.esm'
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { VisibilityOff, Visibility } from "@mui/icons-material";
import SwipeableViews from 'react-swipeable-views';
import { useAuth } from "../AuthContext";
import { useVault } from "./VaultContext";
import { VaultConfig } from "../Provide384/Provide384";
import { useSnackabra } from "../SnackabraContext";
import { ChannelMessage, ChannelStore } from "../../stores/ChannelStore/Channel.Store";




const Login = (props: { config: VaultConfig }) => {
    const snackabra = useSnackabra()
    const auth = useAuth()
    const vault = useVault()
    const [controlMessages, setControlMessages] = React.useState<__.ChannelMessage[]>([])
    const [messages, setMessages] = React.useState<__.ChannelMessage[]>([])
    const [warning, setWarning] = React.useState<string>('')
    const [pin, setPin] = React.useState<string[]>(['', '', '', ''])
    const [channel, setChannel] = React.useState<ChannelStore | null>(null)
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<boolean>(false);
    const [showPassword, setShowPassword] = React.useState<boolean>(false);
    const [activeStep, setActiveStep] = React.useState<number>(0);

    React.useEffect(() => {
        if (vault.id) {
            const loadVault = async () => {
                try {
                    const _c = await snackabra.store?.joinChannel(
                        vault.id as string,
                        vault.identity,
                    )
                    if(_c) setChannel(_c)
                    return true;
                } catch (e) {
                    return false;
                }
            }
            loadVault();
        }
    }, [vault.id])

    React.useEffect(() => {
        if (channel) {
            if(channel.messages) onMessage(channel.messages)
        }
    }, [channel?.messages])

    const onMessage = React.useCallback(async (msgs: ChannelMessage[]) => {
        for(let msg of msgs) {
            if (msg.hasOwnProperty('verificationToken')) {
                setControlMessages((_controlMessages: __.ChannelMessage[]) => [..._controlMessages, msg])
            } else {
                setMessages((_messages: __.ChannelMessage[]) => [..._messages, msg])
            }
        }
    }, [channel?.messages])

    const handleNext = async () => {
        setActiveStep((prevActiveStep: number) => prevActiveStep + 1);
        try {


            if (pin.join('').trim().length !== 16) {
                setError(true)
                return
            }
            setError(false)
            const jwk = await auth.setPassPhrase(pin.join(' ').trim())
            const sb384 = new __.NewSB.SB384(jwk)
            await sb384.ready
            const _vault = { key: jwk, channelId: sb384.hash }
            const _c = await snackabra.store?.joinChannel(
                sb384.hash,
                jwk
            )
            if(_c) setChannel(_c)
            auth.setAfterAuth(JSON.stringify(_vault))
        } catch (e) {
            alert('That didn\'t work, let\'s try again.')
            handleBack()
            console.error(e)
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep: number) => prevActiveStep - 1);
    };

    const handleClickShowPassword = () => setShowPassword((show: boolean) => !show);

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    const handleButtonClick = async () => {
        if (!loading) {
            setError(false);
            setLoading(true);
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
                    setWarning('We detected an issue with your pin, please double check it.')
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
                                                id={'login-button'}
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


