import React from 'react'
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react'
import { Button, Grid, Paper, Typography, useTheme } from "@mui/material"
import { useVault, useSnackabra, ChannelMessage, ChannelStore } from '@384/core';
import { set } from 'mobx';




const MessagesPropagation = observer(() => {
    const theme = useTheme();
    const vault = useVault();
    const SB = useSnackabra();
    const { id } = useParams()
    const readyResolver = React.useRef<any>({ resolve: () => { } });
    const readyFlag = React.useRef<Promise<void>>(new Promise<void>(async () => { }));
    const [channel, setChannel] = React.useState<ChannelStore | null>(null);
    const [messages, setMessages] = React.useState<ChannelMessage[]>([])

    React.useEffect(() => {
        readyFlag.current = new Promise<void>((resolve) => {
            readyResolver.current.resolve = resolve
        })
    }, [])

    React.useEffect(() => {
        if (vault.id && readyFlag.current !== undefined) {
            connect()
        }

    }, [vault.id, readyFlag.current])

    const recieveMessages =  (messages?: ChannelMessage[]) => {
        if(!messages) return []
        const _messages = []
        for (let message of messages) {
            if (message.text){
                const parsed = JSON.parse(message.text)
                console.log(parsed)
                if (parsed.messageType === id) {
                    console.log('Adding message')
                    _messages.push(message)
                }
            }

        }
       return _messages
    }

    const connect = async () => {
        const channel = await SB.store.joinChannel(vault.id, vault.identity)
        readyResolver.current!.resolve()
        setChannel(await channel.connect())

    }

    const sendMessage = async () => {
        console.warn('Waiting for ready flag')
        await readyFlag.current
        console.warn('Sending message')
        if (!channel) throw new Error('Channel not connected, this should not happen!')
        const message = {
            text: JSON.stringify({
                date: new Date().toISOString(),
                contents: 'This is a test message',
                messageType: id
            })
        }
        console.log(channel)
        channel.sendMessage(message)
    }

    return (
        <Grid
            container
            direction="row"
            justifyContent="center"
            alignItems={'flex-start'}
            sx={{
                height: '100vh',
            }}
        >

            <Grid xs={6} item>
                <Paper sx={{ p: 4, bgcolor: theme.palette.background.paper }}>
                    <Button id={'send-test-message'} disabled={!channel} onClick={sendMessage}>Send Test Message</Button>
                    {recieveMessages(channel?.messages).map((message: any, index: number) => {
                            return (
                                <Grid key={index} item xs={12} className='messages'>
                                    <Typography variant="body1" component="pre">
                                        {message._id}
                                    </Typography>
                                    <Typography variant="body1" component="pre">
                                        {message.text}
                                    </Typography>
                                </Grid>
                            )
                        })
                    }
                </Paper>
            </Grid>

        </Grid>
    )
})

export default MessagesPropagation