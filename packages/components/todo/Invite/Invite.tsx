/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from "react"
import { Box, CircularProgress, Fab, Grid, Paper, Typography } from "@mui/material";
import { green, red } from '@mui/material/colors';
import { generateRandomWallet } from "utils/Wallet";
import * as __ from 'lib384/dist/384.esm'
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import Fade from '@mui/material/Fade';
import { AppConfig } from "contexts";

type InviteProps = {
    config: AppConfig,
    seedChannel: { key: JsonWebKey, channelId: string }
}

const Invite = (props: InviteProps) => {
    const [walletId, setWalletId] = React.useState<string | null>(null)
    const [identity, setIdentity] = React.useState<JsonWebKey | null>(null)
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [error, setError] = React.useState(false);

    const buttonSx = {
        ...(success && {
            bgcolor: green[500],
            '&:hover': {
                bgcolor: green[700],
            },
        }),
        ...(error && {
            bgcolor: red[500],
            '&:hover': {
                bgcolor: red[700],
            },
        }),
    };

    React.useEffect(() => {
        if (identity && walletId) {
            registerWallet(walletId)
        }
    }, [identity, walletId])

    const connectWallet = async (walletId: string) => {
        console.log(walletId)
        const sb_config = {
            channel_server: props.config.channel_server,
            channel_ws: props.config.channel_ws,
            storage_server: props.config.storage_server
        };
        try {
            if (!identity) throw new Error('no identity')
            const channelEndpoint = new __.NewSB.ChannelEndpoint(sb_config, props.seedChannel.key, props.seedChannel.channelId)
            const SBServer = new __.NewSB.Snackabra(sb_config)
            const c = await SBServer.create(sb_config, channelEndpoint, identity)
            if (c) {
                const storageChannel = new __.NewSB.ChannelEndpoint(sb_config, c.key, c.channelId)
                console.log(await storageChannel.api.getStorageLimit())
                return true
            }
            return false
        } catch (e) {
            console.error(e)
            return false
        }

    }

    const registerWallet = async (walletId: string) => {
        try {
            if (!identity) throw new Error('no identity')
            if (await connectWallet(walletId)) {
                setSuccess(true)
                setLoading(false)
                setError(false)
            }
        } catch (e) {
            console.error(e)
            setSuccess(false)
            setLoading(false)
            setError(true)
        }
    }

    const handleButtonClick = async () => {
        if (!loading) {
            setSuccess(false);
            setError(false);
            setLoading(true);
            const wallet = await generateWalletStronPin()
            setWalletId(wallet.strongpin)
            setIdentity(wallet.jwk)
        }
    };

    const generateWalletStronPin = (): Promise<{ strongpin: string, jwk: JsonWebKey }> => {
        return new Promise(async (resolve, reject) => {
            try {
                const _strongPin = await generateRandomWallet({ iterations: props.config.iterations, salt: props.config.salt })
                if (!_strongPin) throw new Error('Failed to generate wallet')
                resolve(_strongPin)
            } catch (e) {
                reject(e)
                setSuccess(false)
                setError(true)
                setLoading(false)
            }
        })
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
                        You have been invited!
                    </Typography>
                    <Grid item>
                        <Box sx={{ m: 1, position: 'relative' }}>
                            <Fab
                                aria-label="save"
                                color="primary"
                                sx={buttonSx}
                                onClick={handleButtonClick}
                            >
                                {success ? <ThumbUpAltIcon /> : <Typography variant="body1" align="center" sx={{ fontWeight: 600 }}>Go!</Typography>}
                            </Fab>
                            {loading && (
                                <CircularProgress
                                    size={68}
                                    sx={{
                                        color: green[500],
                                        position: 'absolute',
                                        top: -6,
                                        left: -6,
                                        zIndex: 1,
                                    }}
                                />
                            )}
                        </Box>
                    </Grid>

                    <Fade in={success}>
                        <Grid item>
                            <Typography variant="body1" align="center" gutterBottom>{walletId}</Typography>
                            <Typography variant="subtitle2" align="center" color={'#ff7961'}>Write this down and keep it safe.</Typography>
                            <Typography variant="subtitle2" align="center" color={'#ff7961'}>Do not share it with anyone, this ID is used to create and recover your wallet.</Typography>
                        </Grid>
                    </Fade>

                </Grid>
            </Paper>

        </Grid>
    )
}

export default Invite;


