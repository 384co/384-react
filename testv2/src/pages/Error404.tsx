import React from 'react';
import { Button, Grid } from '@mui/material'
import { PageNotFound } from "@384/components";
import { Link } from 'react-router-dom';

const LinkButton = (props: any) => {
    return (
        <Button
            component={Link}
            variant='contained'
            color='primary'
            size='large'
            to={'/'}
            sx={{
                bottom: 72,
                left: 48,
                position: 'relative',
                textTransform: 'none',
                textDecoration: "none"
            }}
            {...props} >
            Go Home
        </Button>
    );
}


const Error404 = () => {

    return (
        <Grid container justifyContent="center" alignItems="center">
            <Grid xs={6} item>
                <PageNotFound
                    LinkComponent={LinkButton}
                />
            </Grid>
        </Grid>
    );

}

export default Error404;
