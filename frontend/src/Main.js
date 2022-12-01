import Button from '@mui/material/Button'
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {useNavigate} from 'react-router-dom';
import React from 'react';

const theme = createTheme({
  palette: {
    primary: {
      main: '#EEEEEE',
    },
  },
})

const Main = () => {

  const navigate = useNavigate();

  return (
    <div className="App">
      <header className="App-header">
        <p>
          insightUBC
        </p>
       <div>
        <ThemeProvider theme={theme}>
          <Button
              color="primary"
              variant="contained"
              style={{marginRight: '30px'}}
              onClick={() => navigate("/sections")}
            > Courses search </Button>
          <Button
              color="primary"
              variant="contained"
              onClick={() => navigate("/rooms")}
          > Rooms search </Button>
          </ThemeProvider>
        </div>
      </header>
    </div>
  );
}

export default Main;