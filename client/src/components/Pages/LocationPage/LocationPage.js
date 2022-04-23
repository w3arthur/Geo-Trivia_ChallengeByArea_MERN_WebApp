import React, {useRef, useEffect, useState} from "react";
import { Grid, Card, Chip , Paper, Link, Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import monkeyLeft from '../images/monkeyLeft.png';
import monkeyRight from '../images/monkeyRight.png';
import globe from '../images/globe.png';

import PopUP from '../../popup/PopUp';

import Map from './Map'

export default function Location() {
  const { t } = useTranslation();

  const [coordinates, setCoordinates] = useState( [35.3106392, 32.6943036] ); //starting points
  const [mapSelectedCountry, setMapSelectedCountry] = useState( null );
  const [mapYourCoordinates, setMapYourCoordinates] = useState( null );

  const settings = {
    coordinates, setCoordinates
    , mapSelectedCountry, setMapSelectedCountry
    , mapYourCoordinates, setMapYourCoordinates
  }

  const [openFromListPopup, setOpenFromListPopup] = useState(false);
  const [openFromMapPopup, setOpenFromMapPopup] = useState(false);
  const [openYourLocationPopup, setOpenYourLocationPopup] = useState(false);

  const handleClose = () => { setOpenFromListPopup(false); setOpenFromMapPopup(false); setOpenYourLocationPopup(false); };
  const handleClick_openFromListPopup = () => { setOpenFromListPopup(true); };
  const handleClick_openFromMapPopup = () => { setOpenFromMapPopup(true); };
  const handleClick_yourLocationPopup = () => { setOpenYourLocationPopup(true); };

  return (<>
    <Typography variant="h1" sx={{ fontWeight: "bold" }}> {t("Location")} </Typography>
    <Grid container>

      <Selection onClick={handleClick_openFromListPopup} leftMonkey>Choose Location <br /> from list</Selection>

      <Selection onClick={handleClick_openFromMapPopup} rightMonkey>Choose Location <br /> from map</Selection>

      <Selection onClick={handleClick_yourLocationPopup} leftBottomMonkey>Your <br /> Location</Selection>

    </Grid>

<PopUP open={openFromListPopup} handleClose={handleClose} title="Choose Location from list" handleSubmit={()=>{ }} submitText="Set Area">
  <Map settings={settings} height='45vh' getCoordinates={coordinates} setCoordinates={setCoordinates} />
</PopUP>

{/* Location From Map */}
<PopUP open={openFromMapPopup} handleClose={handleClose} title="Choose Location from map" handleSubmit={()=>{ }} submitText="Set Area">
      <Map settings={settings} height='45vh' getCoordinates={coordinates} setCoordinates={setCoordinates} />
      <button type="button" onClick={e => { e.preventDefault();
         ( () => { setCoordinates([88, 88])
           })() }}>
            ******
      </button>
</PopUP>

    {/* Your Location GPS */}
<PopUP open={openYourLocationPopup} handleClose={handleClose} title="Your Location"  handleSubmit={()=>{ }} submitText="Set Area">
    <Map settings={settings} height='45vh' getCoordinates={coordinates} setCoordinates={setCoordinates} />
</PopUP>

  </>);
}


function Selection(props){
  const {leftMonkey, leftBottomMonkey, rightMonkey} = props;
  const additionStyle = leftMonkey? ({marginLeft: 'auto', marginTop: '30vh'}) 
    : rightMonkey? ({marginRight: 'auto', marginTop: '25vh'})
    : leftBottomMonkey? ({marginLeft: 'auto', marginTop: '20vh'})
    : null;
  const styleImage = {display: 'block', width: '75%', maxHeight: '75%', maxWidth: '75%', ...additionStyle};

  return(<>
      <Grid item sm={4} sx={{p:2, display: { xs: 'none', sm: 'block' }}}>
          <SelectionValue onClick={props.onClick}>{props.children}</SelectionValue>
      </Grid>

      {leftMonkey || leftBottomMonkey  ? 
      <SelectionImageGrid onClick={props.onClick}>
        <img alt="monkeyLeft" src={monkeyLeft} style={styleImage}/>
      </SelectionImageGrid> : null}

      <Grid item xs={8} sx={{p:1 ,height: '100%' ,display: { xs: 'block', sm: 'none' }}}>
        <SelectionValue onClick={props.onClick}>{props.children}</SelectionValue>
      </Grid>

      {rightMonkey ? (
        <SelectionImageGrid onClick={props.onClick}>
            <img alt="monkeyRight" src={monkeyRight} style={styleImage} />
        </SelectionImageGrid>
      ) : (<></>)}
      
  </>);
}

function SelectionImageGrid(props){
  return(<>
    <Grid item onClick={props.onClick} xs={4} sx={{height: '100%',display: { xs: 'block', sm: 'none' }}}>
      {props.children}
    </Grid>
  </>);
}

function SelectionValue({onClick, children, sx ,...props}){
  return(<>
      <Paper {...props} className="select"  onClick={ onClick } sx={{height: '50vh', minHeight: {sm:'250px', md: '300px'} , 
      backgroundImage: `url(${globe})`,backgroundRepeat: 'no-repeat', backgroundPosition: '20% 44%', backgroundSize: '140% 140%',  ...sx}} elevation={3}>
        <Typography variant="h2" color="secondary" sx={{mt: 8,fontSize:{xs:'24pt', md: '38pt'}}}>{children}</Typography>
      </Paper>
  </>);
}
