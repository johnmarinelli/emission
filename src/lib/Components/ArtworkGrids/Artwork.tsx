import { map } from "lodash"
import React from "react"
import { Image, StyleSheet, TouchableWithoutFeedback, View } from "react-native"
import { createFragmentContainer, graphql } from "react-relay"

import colors from "lib/data/colors"
import SwitchBoard from "lib/NativeModules/SwitchBoard"
import ImageView from "../OpaqueImageView"
import SerifText from "../Text/Serif"

import { Artwork_artwork } from "__generated__/Artwork_artwork.graphql"

interface Props {
  artwork: Artwork_artwork
  // Passes the Artwork ID back up to another component
  // ideally, this would be used to send an array of Artworks
  // through to Eigen where this item is the default selected one.
  //
  // If it's not provided, then it will push just the one artwork
  // to the switchboard.
  onPress?: (artworkID: string) => void
}

class Artwork extends React.Component<Props, any> {
  handleTap() {
    this.props.onPress && this.props.artwork.id
      ? this.props.onPress(this.props.artwork.id)
      : SwitchBoard.presentNavigationViewController(this, this.props.artwork.href)
  }

  render() {
    const artwork = this.props.artwork
    const partnerName = this.props.artwork.partner && this.props.artwork.partner.name
    return (
      <TouchableWithoutFeedback onPress={this.handleTap.bind(this)}>
        <View>
          <ImageView style={styles.image} aspectRatio={artwork.image.aspect_ratio} imageURL={artwork.image.url} />
          {this.artists()}
          {this.artworkTitle()}
          {partnerName && <SerifText style={styles.text}>{partnerName}</SerifText>}
          {this.saleMessage()}
        </View>
      </TouchableWithoutFeedback>
    )
  }

  artists() {
    const artists = this.props.artwork.artists
    if (artists && artists.length > 0) {
      return <SerifText style={[styles.text, styles.artist]}>{map(artists, "name").join(", ")}</SerifText>
    } else {
      return null
    }
  }

  artworkTitle() {
    const artwork = this.props.artwork
    if (artwork.title) {
      return (
        <SerifText style={styles.text}>
          <SerifText style={[styles.text, styles.title]}>{artwork.title}</SerifText>
          {artwork.date ? ", " + artwork.date : ""}
        </SerifText>
      )
    } else {
      return null
    }
  }

  saleMessage() {
    const artwork = this.props.artwork
    if (artwork.is_in_auction && artwork.sale_artwork) {
      if (!artwork.sale_artwork.sale.is_closed) {
        let numberOfBids = null
        try {
          numberOfBids = artwork.sale_artwork.bidder_positions_count
        } catch (e) {
          console.error(`Sentry issue #274707594 triggered with props: ${JSON.stringify(this.props)}`)
          return null
        }
        let text = artwork.sale_artwork.opening_bid.display
        if (numberOfBids > 0) {
          text = `${artwork.sale_artwork.current_bid.display} (${numberOfBids} bid${numberOfBids === 1 ? "" : "s"})`
        }
        return (
          <View style={{ flexDirection: "row" }}>
            <Image style={{ marginRight: 4 }} source={require("../../../../images/paddle.png")} />
            <SerifText style={styles.text}>{text}</SerifText>
          </View>
        )
      } else {
        return <SerifText style={styles.text}>Auction Closed</SerifText>
      }
    } else {
      return artwork.sale_message && <SerifText style={styles.text}>{artwork.sale_message}</SerifText>
    }
  }
}

const styles = StyleSheet.create({
  image: {
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    color: colors["gray-semibold"],
  },
  artist: {
    fontWeight: "bold",
  },
  title: {
    fontStyle: "italic",
  },
})

export default createFragmentContainer(
  Artwork,
  graphql`
    fragment Artwork_artwork on Artwork {
      title
      date
      sale_message
      is_in_auction
      id
      sale_artwork {
        opening_bid {
          display
        }
        current_bid {
          display
        }
        bidder_positions_count
        sale {
          is_closed
        }
      }
      image {
        url(version: "large")
        aspect_ratio
      }
      artists(shallow: true) {
        name
      }
      partner {
        name
      }
      href
    }
  `
)
