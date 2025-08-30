import React, { useState, useEffect, useCallback } from "react";
import {
  BlankContainer,
  ButtonContainer,
  EventButton,
  EventCards,
  EventGreyText,
  EventText,  
  EventLink,
  ProgressBarHolder,
  ProgressContainer,
  ThankYouContainer,
  TypographyStyled,
} from "./styles";
import { 
  CircularProgressbar, 
  // buildStyles 
} from "react-circular-progressbar";

import { 
  Typography, 
  Box, 
  Grid, 
  Chip, 
  Card, 
  CardContent, 
  LinearProgress, 
  Skeleton,
  Tooltip,
  useTheme
} from "@mui/material";
import Moment from 'moment';
import Link from 'next/link';
import { useAuthInfo } from '@propelauth/react';
import ImpactMetrics from '../ImpactMetrics';


function EventFeature(props) {
  // TODO: Fix unused variable warning here
  console.log("EventFeature props:", props);
  const {
    title,
    description,
    type,
    nonprofits,
    start_date,
    end_date,
    location,
    devpostUrl,
    event_id,
    id,
    rawEventLinks,        
    donationGoals,
    donationCurrent,    
  } = props;

  
  // TODO: Is the schema on the backend wrong? Or is the schema here wrong?
  const eventLinks = typeof rawEventLinks === 'string' ? [rawEventLinks] : rawEventLinks
  
  

  return (
    <EventCards container direction="column">      
      <Link href={`/hack/${event_id}`} passHref>
        <div style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '12px' }}>
            <EventLink variant="h3">{title}</EventLink>
            <EventText variant="h3">{description}</EventText>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            {
              Moment(new Date()).format("YYYY") === Moment(start_date).format('YYYY') && 
              <Typography variant="body1" sx={{ fontSize: '1rem', color: '#333', marginBottom: '8px' }}>
                {Moment(start_date).format('MMM Do')} to {Moment(end_date).format('MMM Do YYYY')}
              </Typography>      
            }

            {
              Moment(new Date()).format("YYYY") !== Moment(start_date).format('YYYY') &&
              <Typography variant="body1" sx={{ fontSize: '1rem', color: '#333', marginBottom: '8px' }}>
                {Moment(start_date).format('MMM Do YYYY')} to {Moment(end_date).format('MMM Do YYYY')}
              </Typography>
            }
          </div>
        
          <EventGreyText variant="button">{location}</EventGreyText>                    
          
          {/* Only render the donation progress if there is data */}
          {(donationCurrent?.food > 0 || donationCurrent?.prize > 0 || donationCurrent?.swag > 0) && (
            <ProgressContainer
              container
              justifyContent="space-around"
              direction="column"
            >
              <BlankContainer 
                container 
                justifyContent="center" 
                direction="row" 
                sx={{ 
                  gap: { xs: '8px', sm: '16px', md: '20px' }, 
                  flexWrap: 'wrap',
                  '@media (max-width: 400px)': {
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }
                }}
              >
                {donationCurrent?.food > 0 && (
                  <ProgressBarHolder container justifyContent="center">
                    <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
                      Food
                    </Typography>
                    <Box sx={{ width: '60px', height: '60px' }}>
                      <CircularProgressbar
                        styles={{
                          path: {
                            stroke: "#003486",
                          },
                          trail: {
                            stroke: "#ffffff",
                          },
                          text: {
                            fill: "#003486",
                            fontSize: "20px",
                            fontWeight: "bold"
                          },
                        }}
                        value={(donationCurrent.food / donationGoals.food) * 100}
                        text={`${(
                          (donationCurrent.food / donationGoals.food) *
                          100
                        ).toFixed(0)}%`}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.7rem', 
                      textAlign: 'center',
                      lineHeight: '1.2',
                      wordBreak: 'break-all',
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}>
                      ${donationCurrent.food}/{donationGoals.food}
                    </Typography>
                  </ProgressBarHolder>
                )}

                {donationCurrent?.prize > 0 && (
                <ProgressBarHolder container justifyContent="center">
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
                    Prize
                  </Typography>
                  <Box sx={{ width: '60px', height: '60px' }}>
                    <CircularProgressbar
                      styles={{
                        path: {
                          stroke: "#003486",
                        },
                        trail: {
                          stroke: "#ffffff",
                        },
                        text: {
                          fill: "#003486",
                          fontSize: "20px",
                          fontWeight: "bold"
                        },
                      }}
                      value={(donationCurrent.prize / donationGoals.prize) * 100}
                      text={`${(
                        (donationCurrent.prize / donationGoals.prize) *
                        100
                      ).toFixed(0)}%`}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ 
                    fontSize: '0.7rem', 
                    textAlign: 'center',
                    lineHeight: '1.2',
                    wordBreak: 'break-all',
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}>
                    ${donationCurrent?.prize}/{donationGoals?.prize}
                  </Typography>
                </ProgressBarHolder>
                )}

                {donationCurrent?.swag > 0 && (
                  <ProgressBarHolder container justifyContent="center">
                    <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>
                      Swag
                    </Typography>
                    <Box sx={{ width: '60px', height: '60px' }}>
                      <CircularProgressbar
                        styles={{
                          path: {
                            stroke: "#003486",
                          },
                          trail: {
                            stroke: "#ffffff",
                          },
                          text: {
                            fill: "#003486",
                            fontSize: "20px",
                            fontWeight: "bold"
                          },
                        }}
                        value={(donationCurrent?.swag / donationGoals?.swag) * 100}
                        text={`${(
                          (donationCurrent?.swag / donationGoals?.swag) *
                          100
                        ).toFixed(0)}%`}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ 
                      fontSize: '0.7rem', 
                      textAlign: 'center',
                      lineHeight: '1.2',
                      wordBreak: 'break-all',
                      maxWidth: '100%',
                      overflow: 'hidden'
                    }}>
                      ${donationCurrent.swag}/{donationGoals.swag}
                    </Typography>
                  </ProgressBarHolder>
                )}
              </BlankContainer>

              {donationCurrent?.thank_you?.length > 0 && (
                <ThankYouContainer>
                  <Typography variant="caption" sx={{ fontSize: '0.8rem', textAlign: 'center', fontStyle: 'italic', mt: 1 }}>
                    Special thanks to: {donationCurrent?.thank_you} for donating!
                  </Typography>
                </ThankYouContainer>
              )}
            </ProgressContainer>
          )}

          <ButtonContainer
            container
            direction="row"
            justifyContent="center"
            sx={{ mt: 'auto', gap: '8px', flexWrap: 'wrap', pt: 2 }}
          >
            {
              eventLinks?.map((alink) => {
                const isExternal = alink?.link?.startsWith('http');
                return (
                  <Link
                  key={alink?.name} 
                  prefetch={false} href={alink?.link} target={isExternal ? '_blank' : '_self'} onClick={(e) => {
                    if (isExternal) {
                      e.preventDefault();
                      window.open(alink?.link, '_blank');
                    }
                  }}>
                    <EventButton color={alink.color} variant={alink.variant}>
                      {alink?.name}
                    </EventButton>
                  </Link>
                );
              })
            }
          </ButtonContainer>
        
          {/* Impact Metrics Section */}
          <ImpactMetrics 
              event_id={event_id} 
              eventData={{ start_date, end_date, location, title, id }} 
            />
        </div>
      </Link>
    </EventCards>
  );
}

export default EventFeature;
