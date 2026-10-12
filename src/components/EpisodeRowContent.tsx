import EpisodeThumbnail from './EpisodeThumbnail';
import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import Text from './ui/Text';
import {isTV} from '../lib/tv';

type EpisodeRowContentProps = {
  title: string;
  description?: string;
  image?: string;
  thumbnail?: React.ReactNode;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  onShowDetailsPressIn?: () => void;
  onShowDetails?: () => void;
};

export const getValidImageUri = (image?: string): string | undefined => {
  const value = image?.trim();
  return value && /^https?:\/\//i.test(value) ? value : undefined;
};

export const hasEpisodeMetadata = ({
  description,
  image,
}: Pick<EpisodeRowContentProps, 'description' | 'image'>): boolean =>
  Boolean(description?.trim() || getValidImageUri(image));

const EpisodeRowContent = ({
  title,
  description,
  image,
  thumbnail,
  accentColor,
  textColor,
  mutedTextColor,
  onShowDetailsPressIn,
  onShowDetails,
}: EpisodeRowContentProps) => {
  const imageUri = getValidImageUri(image);
  const descriptionText = description?.trim();
  const sourceEndsWithEllipsis = Boolean(
    descriptionText && /(?:\u2026|\.{3})\s*$/.test(descriptionText),
  );
  const [descriptionTruncated, setDescriptionTruncated] = useState(
    sourceEndsWithEllipsis,
  );
  const [visibleDescription, setVisibleDescription] = useState(
    descriptionText ?? '',
  );
  const [descriptionWidth, setDescriptionWidth] = useState(0);
  const [morePosition, setMorePosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const likelyDescriptionTruncated = Boolean(
    descriptionText &&
    descriptionWidth > 0 &&
    descriptionText.length * 6.1 > descriptionWidth * 1.9,
  );

  useEffect(() => {
    setDescriptionTruncated(sourceEndsWithEllipsis);
    setVisibleDescription(
      sourceEndsWithEllipsis
        ? (descriptionText?.replace(/(?:\u2026|\.{3})\s*$/, '').trimEnd() ?? '')
        : (descriptionText ?? ''),
    );
  }, [descriptionText, sourceEndsWithEllipsis]);

  useEffect(() => {
    if (likelyDescriptionTruncated && descriptionText) {
      const fittingCharacterCount = Math.max(
        1,
        Math.floor((descriptionWidth * 2) / 6.1) - 8,
      );
      setVisibleDescription(
        descriptionText.slice(0, fittingCharacterCount).trimEnd(),
      );
      setDescriptionTruncated(true);
    }
  }, [descriptionText, descriptionWidth, likelyDescriptionTruncated]);

  return (
    <>
      {thumbnail ?? (
        <EpisodeThumbnail uri={imageUri} accentColor={accentColor} />
      )}
      <View className="min-w-0 flex-1">
        <Text
          role="titleMedium"
          numberOfLines={descriptionText ? 1 : 2}
          style={{color: textColor}}>
          {title}
        </Text>
        {descriptionText ? (
          <View style={{marginTop: 2, position: 'relative'}}>
            <Text
              role="bodySmall"
              numberOfLines={2}
              onLayout={event => {
                const width = Math.round(event.nativeEvent.layout.width);
                setDescriptionWidth(current =>
                  current === width ? current : width,
                );
              }}
              onTextLayout={event => {
                if (!descriptionTruncated) {
                  setMorePosition(null);
                  return;
                }
                const lastLine = event.nativeEvent.lines.at(-1);
                if (!lastLine) return;
                const nextPosition = {
                  left: Math.ceil(lastLine.x + lastLine.width + 3),
                  top: Math.floor(lastLine.y),
                };
                setMorePosition(current =>
                  current?.left === nextPosition.left &&
                  current?.top === nextPosition.top
                    ? current
                    : nextPosition,
                );
              }}
              style={{color: mutedTextColor}}>
              {visibleDescription}
              {descriptionTruncated ? '…' : ''}
            </Text>
            {!isTV && descriptionTruncated && onShowDetails && morePosition ? (
              <TouchableOpacity
                accessibilityLabel={`Show full description for ${title}`}
                accessibilityRole="button"
                focusable
                hitSlop={8}
                onPressIn={onShowDetailsPressIn}
                onPress={event => {
                  event.stopPropagation();
                  onShowDetails();
                }}
                style={{
                  left: morePosition.left,
                  position: 'absolute',
                  top: morePosition.top,
                  zIndex: 2,
                }}>
                <Text
                  role="bodySmall"
                  style={{color: mutedTextColor, fontWeight: '700'}}>
                  more
                </Text>
              </TouchableOpacity>
            ) : null}
            {descriptionWidth > 0 ? (
              <Text
                accessible={false}
                pointerEvents="none"
                role="bodySmall"
                onTextLayout={event => {
                  const lines = event.nativeEvent.lines;
                  const truncated =
                    lines.length > 2 ||
                    sourceEndsWithEllipsis ||
                    likelyDescriptionTruncated;
                  if (lines.length > 2) {
                    const firstTwoLines = lines
                      .slice(0, 2)
                      .map(line => line.text)
                      .join('');
                    setVisibleDescription(firstTwoLines.slice(0, -8).trimEnd());
                  } else if (!truncated) {
                    setVisibleDescription(descriptionText);
                  }
                  setDescriptionTruncated(current =>
                    current === truncated ? current : truncated,
                  );
                }}
                style={{
                  color: 'transparent',
                  left: 0,
                  opacity: 0.01,
                  position: 'absolute',
                  top: 0,
                  width: descriptionWidth,
                }}>
                {descriptionText}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </>
  );
};

export default EpisodeRowContent;
