/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { sharedControlComponents, RadioButtonOption } from '@superset-ui/chart-controls';
import { HandlerFunction, JsonValue, styled } from '@superset-ui/core';
import { EventHandlers } from '../types';
import Echart from '../components/Echart';
import { EchartsTimeseriesFormData, TimeseriesChartTransformedProps } from './types';
import { currentSeries } from '../utils/series';
import { AreaChartExtraControlsOptions, TIMESERIES_CONSTANTS } from '../constants';

const { RadioButtonControl } = sharedControlComponents;

const ExtraControlsWrapper = styled.div`
  text-align: center;
`;

function useExtraControl({
  formData,
  setControlValue,
}: {
  formData: EchartsTimeseriesFormData;
  setControlValue: HandlerFunction | undefined;
}) {
  const { stack, area } = formData;
  const [extraValue, setExtraValue] = useState<JsonValue | undefined>(stack ?? undefined);

  useEffect(() => {
    setExtraValue(stack ?? undefined);
  }, [stack]);

  const extraControlsOptions = useMemo(() => {
    if (area) {
      return AreaChartExtraControlsOptions;
    }
    return [];
  }, [area]);

  const extraControlsHandler = useCallback(
    (value: RadioButtonOption[0]) => {
      if (area) {
        if (setControlValue) {
          setControlValue('stack', value);
          setExtraValue(value ?? undefined);
        }
      }
    },
    [area, setControlValue],
  );

  return {
    extraControlsOptions,
    extraControlsHandler,
    extraValue,
  };
}

// @ts-ignore
export default function EchartsTimeseries({
  formData,
  height,
  width,
  echartOptions,
  groupby,
  labelMap,
  selectedValues,
  setDataMask,
  setControlValue,
}: TimeseriesChartTransformedProps) {
  const { emitFilter, extraControls } = formData;

  const handleChange = useCallback(
    (values: string[]) => {
      if (!emitFilter) {
        return;
      }
      const groupbyValues = values.map(value => labelMap[value]);

      setDataMask({
        extraFormData: {
          filters:
            values.length === 0
              ? []
              : groupby.map((col, idx) => {
                  const val = groupbyValues.map(v => v[idx]);
                  if (val === null || val === undefined)
                    return {
                      col,
                      op: 'IS NULL',
                    };
                  return {
                    col,
                    op: 'IN',
                    val: val as (string | number | boolean)[],
                  };
                }),
        },
        filterState: {
          label: groupbyValues.length ? groupbyValues : undefined,
          value: groupbyValues.length ? groupbyValues : null,
          selectedValues: values.length ? values : null,
        },
      });
    },
    [groupby, labelMap, setDataMask, emitFilter],
  );

  const eventHandlers: EventHandlers = {
    click: props => {
      const { seriesName: name, value } = props;
      const xValue = value[0].getTime?.() || value[0];
      console.log(props, name, xValue);
      const values = Object.values(selectedValues);
      if (values.includes(name)) {
        handleChange(values.filter(v => v !== name));
      } else {
        handleChange([name]);
      }
    },
    mousemove: params => {
      currentSeries.name = params.seriesName;
    },
    mouseout: () => {
      currentSeries.name = '';
    },
  };

  const { extraControlsOptions, extraControlsHandler, extraValue } = useExtraControl({
    formData,
    setControlValue,
  });

  return (
    <>
      {extraControls && (
        <ExtraControlsWrapper>
          <RadioButtonControl
            options={extraControlsOptions}
            onChange={extraControlsHandler}
            value={extraValue}
          />
        </ExtraControlsWrapper>
      )}
      <Echart
        height={extraControls ? height - TIMESERIES_CONSTANTS.extraControlsOffset : height}
        width={width}
        echartOptions={echartOptions}
        eventHandlers={eventHandlers}
        selectedValues={selectedValues}
      />
    </>
  );
}
