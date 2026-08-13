import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import Typography from "@mui/material/Typography";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { FC, FocusEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Line } from "react-chartjs-2";
import { useGetClientDashboardStatisticsQuery } from "src/shared/api/statistics";
import { SurfaceBlock } from "@encvoy-id/components";
import { CustomIcon } from "@encvoy-id/components";
import styles from "./MetricsInfo.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface IMetricsInfoProps {
  clientId?: string;
}

const PERIOD_OPTIONS = [7, 30, 90, 365] as const;
const AUTOPLAY_DELAY_MS = 7000;
const SLIDE_IDS = ["authCount", "uniqueUsers", "authMethods"] as const;

type TSlideId = (typeof SLIDE_IDS)[number];

export const MetricsInfo: FC<IMetricsInfoProps> = ({ clientId }) => {
  const { t: translate, i18n } = useTranslation();
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [activeSlide, setActiveSlide] = useState<TSlideId>("authCount");
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const { data, isLoading, isFetching, isError } =
    useGetClientDashboardStatisticsQuery(
      {
        clientId: clientId ?? "",
        days: selectedDays,
      },
      { skip: !clientId }
    );
  const days = data?.days ?? selectedDays;

  const labels = useMemo(() => {
    return (data?.points || []).map(({ date }) => {
      const [year = "", month = "", day = ""] = date.split("-");
      const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

      return new Intl.DateTimeFormat(i18n.language, {
        day: "2-digit",
        month: "2-digit",
      }).format(parsedDate);
    });
  }, [data?.points, i18n.language]);

  const authData = useMemo(
    () => (data?.points || []).map(({ authCount }) => authCount),
    [data?.points]
  );

  const uniqueUsersData = useMemo(
    () => (data?.points || []).map(({ uniqueUsersCount }) => uniqueUsersCount),
    [data?.points]
  );

  const totalAuthCount = useMemo(
    () =>
      (data?.authMethods || []).reduce(
        (total, { authCount }) => total + authCount,
        0
      ),
    [data?.authMethods]
  );

  const authMethods = useMemo(() => {
    return (data?.authMethods || []).map(({ type, authCount }) => {
      const share = totalAuthCount ? authCount / totalAuthCount : 0;

      return {
        type,
        authCount,
        share,
        label: type,
      };
    });
  }, [data?.authMethods, totalAuthCount]);

  const countFormatter = useMemo(
    () => new Intl.NumberFormat(i18n.language),
    [i18n.language]
  );

  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(i18n.language, {
        style: "percent",
        maximumFractionDigits: 1,
      }),
    [i18n.language]
  );

  const maxAuthCount = authData.length ? Math.max(...authData) : 0;
  const maxUniqueUsers = uniqueUsersData.length
    ? Math.max(...uniqueUsersData)
    : 0;
  const activeSlideIndex = SLIDE_IDS.indexOf(activeSlide);
  const authChartData = {
    labels,
    datasets: [
      {
        label: translate("pages.clientDetails.statistics.authCount"),
        data: authData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgb(75, 192, 192)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const uniqueUsersChartData = {
    labels,
    datasets: [
      {
        label: translate("pages.clientDetails.statistics.uniqueUsers"),
        data: uniqueUsersData,
        borderColor: "rgb(153, 102, 255)",
        backgroundColor: "rgba(153, 102, 255, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgb(153, 102, 255)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          maxTicksLimit: 8,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
      },
    },
    elements: {
      point: {
        hoverRadius: 6,
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  const renderChartState = (chartData: typeof authChartData) => {
    if (isLoading || isFetching) {
      return (
        <Typography className={styles.stateText}>
          {translate("helperText.loading")}
        </Typography>
      );
    }

    if (isError) {
      return (
        <Typography className={styles.stateText}>
          {translate("pages.clientDetails.statistics.loadError")}
        </Typography>
      );
    }

    return <Line data={chartData} options={chartOptions} />;
  };

  const renderAuthMethodsState = () => {
    if (isLoading || isFetching) {
      return (
        <Typography className={styles.stateText}>
          {translate("helperText.loading")}
        </Typography>
      );
    }

    if (isError) {
      return (
        <Typography className={styles.stateText}>
          {translate("pages.clientDetails.statistics.loadError")}
        </Typography>
      );
    }

    if (!authMethods.length) {
      return (
        <Typography className={styles.stateText}>
          {translate("pages.clientDetails.statistics.authMethods.noData")}
        </Typography>
      );
    }

    return (
      <Box className={styles.methodsList}>
        {authMethods.map(({ type, label, authCount, share }) => (
          <Box key={type} className={styles.methodItem}>
            <Box className={styles.methodHead}>
              <Typography className="text-14">{label}</Typography>
              <Typography className={styles.methodShare}>
                {percentFormatter.format(share)}
              </Typography>
            </Box>
            <Typography className={styles.option}>
              {countFormatter.format(authCount)} /{" "}
              {countFormatter.format(totalAuthCount)}
            </Typography>
            <Box className={styles.methodBar}>
              <Box
                className={styles.methodBarFill}
                style={{
                  width: `${Math.max(share * 100, share > 0 ? 4 : 0)}%`,
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  const slides = [
    {
      id: "authCount" as const,
      title: translate("pages.clientDetails.statistics.authCount"),
      meta: [
        {
          label: translate("pages.clientDetails.statistics.period"),
          value: countFormatter.format(days),
        },
        {
          label: translate("pages.clientDetails.statistics.maximum"),
          value: countFormatter.format(maxAuthCount),
        },
      ],
      content: (
        <Box className={styles.chartContainer}>
          {renderChartState(authChartData)}
        </Box>
      ),
    },
    {
      id: "uniqueUsers" as const,
      title: translate("pages.clientDetails.statistics.uniqueUsers"),
      meta: [
        {
          label: translate("pages.clientDetails.statistics.period"),
          value: countFormatter.format(days),
        },
        {
          label: translate("pages.clientDetails.statistics.maximum"),
          value: countFormatter.format(maxUniqueUsers),
        },
      ],
      content: (
        <Box className={styles.chartContainer}>
          {renderChartState(uniqueUsersChartData)}
        </Box>
      ),
    },
    {
      id: "authMethods" as const,
      title: translate("pages.clientDetails.statistics.authMethods.title"),
      meta: [
        {
          label: translate("pages.clientDetails.statistics.period"),
          value: countFormatter.format(days),
        },
        {
          label: translate("pages.clientDetails.statistics.authMethods.total"),
          value: countFormatter.format(totalAuthCount),
        },
      ],
      content: renderAuthMethodsState(),
    },
  ];
  const currentSlide =
    slides.find(({ id }) => id === activeSlide) ?? slides[0];

  useEffect(() => {
    if (isAutoPlayPaused || slides.length < 2) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((prevSlide) => {
        const currentIndex = SLIDE_IDS.indexOf(prevSlide);
        const nextIndex = (currentIndex + 1) % SLIDE_IDS.length;

        return SLIDE_IDS[nextIndex];
      });
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearInterval(timer);
  }, [isAutoPlayPaused, slides.length]);

  const handleCarouselBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsAutoPlayPaused(false);
    }
  };

  return (
    <SurfaceBlock sx={{ padding: "20px" }}>
      <Box className={styles.toolbar}>
        <Box className={styles.titleBlock}>
          <CustomIcon Icon={AssessmentOutlinedIcon} color="textSecondary" />
          <Typography className="text-15-medium">
            {translate("pages.clientDetails.statistics.title")}
          </Typography>
        </Box>
        <FormControl size="small" className={styles.periodControl}>
          <InputLabel id="statistics-period-select-label">
            {translate("pages.clientDetails.statistics.period")}
          </InputLabel>
          <Select
            labelId="statistics-period-select-label"
            value={String(selectedDays)}
            label={translate("pages.clientDetails.statistics.period")}
            onChange={(event) => setSelectedDays(Number(event.target.value))}
          >
            {PERIOD_OPTIONS.map((periodOption) => (
              <MenuItem key={periodOption} value={String(periodOption)}>
                {periodOption}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box
        className={styles.carousel}
        onMouseEnter={() => setIsAutoPlayPaused(true)}
        onMouseLeave={() => setIsAutoPlayPaused(false)}
        onFocus={() => setIsAutoPlayPaused(true)}
        onBlur={handleCarouselBlur}
      >
        <Box key={currentSlide.id} className={styles.slideCard}>
          <Box className={styles.chartHeader}>
            <Typography className="text-14">{currentSlide.title}</Typography>
            <Box className={styles.chartMeta}>
              {currentSlide.meta.map((item) => (
                <Typography key={item.label} className={styles.option}>
                  {item.label}:{" "}
                  <span className={styles.optionValue}>{item.value}</span>
                </Typography>
              ))}
            </Box>
          </Box>
          <Box className={styles.slideContent}>{currentSlide.content}</Box>

          <Box className={styles.slideDots}>
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`${styles.slideDot} ${
                  index === activeSlideIndex ? styles.slideDotActive : ""
                }`}
                onClick={() => setActiveSlide(slide.id)}
                aria-label={slide.title}
                aria-pressed={index === activeSlideIndex}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </SurfaceBlock>
  );
};
