import React, {Fragment} from "react";
import { Button } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#EEEEEE",
    },
  },
});

export default function Sections() {

    function handleGetQuery() {
        console.log("hello");
    }

    return(
        <Fragment>
            <h3 style={{ marginLeft: 30}}>Search courses:</h3>
            <div style={{display: "flex",  justifyContent: "center", alignItems: "center", width: 1200, height: 800, backgroundColor: "lightBlue" }}>
                <ThemeProvider theme={theme}>
                    <label className="m-3">
                    Course Average:
                    <input
                    type="text"
                    className="form-control"
                    value={2}
                    onChange={(e) => {
                        console.log("h");
                    }}
                    />
                    </label>
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={handleGetQuery}
                        style={{ width: 90 }}
                        >
                        Search
                    </Button>
                </ThemeProvider>
            </div>
        </Fragment>
    )
    
}
