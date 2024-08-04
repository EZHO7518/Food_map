import { useEffect, useState } from 'react';

export default function Home() {
  const [places, setPlaces] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [reviews, setReviews] = useState({});
  const [currentMarker, setCurrentMarker] = useState(null);
  const [currentInfowindow, setCurrentInfowindow] = useState(null);
  const [favorites, setFavorites] = useState([]);

  const isFavorite = (place) => {
    return favorites.some(favorite => favorite.id === place.id);
  };

  const handleFavoriteClick = (place) => {
    setFavorites(prevFavorites => {
      if (isFavorite(place)) {
        return prevFavorites.filter(favorite => favorite.id !== place.id);
      } else {
        return [...prevFavorites, place];
      }
    });
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=0dbc37011c6b4aa197010b976d3c290d&libraries=services&autoload=false`;
    script.async = true;

    script.onload = () => {
      kakao.maps.load(() => {
        if (typeof kakao !== 'undefined' && kakao.maps) {
          const mapContainer = document.getElementById('map');
          const mapOption = {
            center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심 좌표
            level: 3,
          };
          const map = new window.kakao.maps.Map(mapContainer, mapOption);
          setMap(map);

          const ps = new window.kakao.maps.services.Places();

          const searchPlaces = (keyword, coords) => {
            if (!keyword.trim() && !coords) {
              alert('검색어를 입력해주세요!');
              return;
            }

            const callback = (data, status, pagination) => {
              if (status === kakao.maps.services.Status.OK) {
                setPlaces(data);
                if (coords) {
                  map.setCenter(new window.kakao.maps.LatLng(coords.latitude, coords.longitude));
                } else {
                  map.setCenter(new window.kakao.maps.LatLng(data[0].y, data[0].x));
                }
                map.setLevel(3);

                // 이전 마커 제거
                markers.forEach(marker => marker.setMap(null));
                setMarkers([]);

                const newMarkers = data.map(place => {
                  const coords = new window.kakao.maps.LatLng(place.y, place.x);
                  const marker = new window.kakao.maps.Marker({
                    map: map,
                    position: coords,
                  });

                  const infowindowContent = document.createElement('div');
                  infowindowContent.className = 'infowindow';
                  infowindowContent.innerHTML = `
                    <strong>${place.place_name}</strong>
                    <div class="address">${place.road_address_name ? place.road_address_name : place.address_name}</div>
                    <div class="phone">${place.phone ? place.phone : ''}</div>
                  `;

                  const infowindow = new window.kakao.maps.InfoWindow({
                    content: infowindowContent,
                  });

                  kakao.maps.event.addListener(marker, 'click', () => {
                    // 이전 마커와 인포윈도우 제거
                    if (currentMarker) {
                      currentMarker.setMap(null);
                    }
                    if (currentInfowindow) {
                      currentInfowindow.close();
                    }

                    // 새로운 마커와 인포윈도우 설정
                    infowindow.open(map, marker);
                    setCurrentMarker(marker);
                    setCurrentInfowindow(infowindow);
                    setSelectedPlace(place); // 선택된 장소 정보 설정
                  });

                  return marker;
                });

                setMarkers(newMarkers);
              } else {
                alert('검색 결과가 없습니다.');
              }
            };

            if (coords) {
              ps.categorySearch('FD6', callback, {
                location: new window.kakao.maps.LatLng(coords.latitude, coords.longitude),
                radius: 5000,
              });
            } else {
              ps.keywordSearch(keyword, callback);
            }
          };

          window.searchPlaces = searchPlaces; // 검색 함수 전역에 저장
        }
      });
    };

    document.head.appendChild(script);
  }, []);

  const handleSearchClick = () => {
    if (!keyword.trim()) {
      alert('검색어를 입력해주세요!');
    } else {
      window.searchPlaces(keyword); // 전역에 저장된 검색 함수 호출
    }
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        if (map) {
          const newCenter = new window.kakao.maps.LatLng(latitude, longitude);
          map.setCenter(newCenter);
        }
        window.searchPlaces('', { latitude, longitude }); // 위치 기반 검색 호출
      }, error => {
        console.error(error);
        alert('위치 정보를 가져오는데 실패했습니다.');
      });
    } else {
      alert('위치 정보를 지원하지 않는 브라우저입니다.');
    }
  };

  const handlePlaceClick = (place) => {
    const coords = new window.kakao.maps.LatLng(place.y, place.x);
    if (map) {
      map.setCenter(coords);
      map.setLevel(3);
    }
    setSelectedPlace(place);

    // 이전 마커와 인포윈도우 제거
    if (currentMarker) {
      currentMarker.setMap(null);
    }
    if (currentInfowindow) {
      currentInfowindow.close();
    }

    // 새로운 마커 생성 및 지도에 추가
    const marker = new window.kakao.maps.Marker({
      map: map,
      position: coords,
    });

    const infowindowContent = document.createElement('div');
    infowindowContent.className = 'infowindow';
    infowindowContent.innerHTML = `
      <strong>${place.place_name}</strong>
      <div class="address">${place.road_address_name ? place.road_address_name : place.address_name}</div>
      <div class="phone">${place.phone ? place.phone : ''}</div>
    `;

    const infowindow = new window.kakao.maps.InfoWindow({
      content: infowindowContent,
    });

    infowindow.open(map, marker);

    // 상태 업데이트
    setCurrentMarker(marker);
    setCurrentInfowindow(infowindow);
  };

  const handleReviewSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const review = formData.get('review');
    const rating = formData.get('rating');
    if (review && rating && selectedPlace) {
      const placeId = selectedPlace.id;
      setReviews((prevReviews) => ({
        ...prevReviews,
        [placeId]: [
          ...(prevReviews[placeId] || []),
          { review, rating, date: new Date().toLocaleString() },
        ],
      }));
      event.target.reset();
    }
  };

  return (
    <div>
      <div className="search-container">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="지역이나 음식점 이름을 입력하세요"
          className="search-input"
        />
        <button onClick={handleSearchClick} className="search-button">검색</button>
        <button onClick={handleLocationClick} className="location-button">내 위치로 검색</button>
      </div>
      <div id="map" className="map"></div>
      <div className="list-review-container">
        <div className="places-list-container">
          <h2>검색된 맛집 리스트</h2>
          <ul className="places-list">
            {places.map((place, index) => (
              <li key={index}>
                <span onClick={() => handlePlaceClick(place)} style={{ cursor: 'pointer' }}>
                  <strong>{place.place_name}</strong>
                </span>
                <button
                  className="favorite-button"
                  style={{
                    backgroundColor: isFavorite(place) ? '#ccc' : '#ffeb00',
                    color: isFavorite(place) ? 'white' : 'black',
                  }}
                  onClick={() => handleFavoriteClick(place)}
                >
                  즐겨찾기 {isFavorite(place) ? '제거' : '추가'}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {selectedPlace && (
          <div className="review-container">
            <h3>{selectedPlace.place_name} 리뷰</h3>
            <ul>
              {(reviews[selectedPlace.id] || []).map((review, index) => (
                <li key={index} className="review-item">
                  <div>
                    <strong>평점:</strong> {review.rating} / 5
                  </div>
                  <div>{review.review}</div>
                  <div>
                    <em>{review.date}</em>
                  </div>
                </li>
              ))}
            </ul>
            <form className="review-form" onSubmit={handleReviewSubmit}>
              <input type="number" name="rating" placeholder="평점 (1-5)" min="1" max="5" required />
              <textarea name="review" placeholder="리뷰를 작성하세요" required></textarea>
              <button type="submit">리뷰 제출</button>
            </form>
          </div>
        )}
      </div>
      <div className="favorites-container">
        <h2>즐겨찾기 리스트</h2>
        <ul className="favorites-list">
          {favorites.map((favorite, index) => (
            <li key={index} className="place-item">
              <span onClick={() => handlePlaceClick(favorite)} style={{ cursor: 'pointer' }}>
                <strong>{favorite.place_name}</strong>
              </span>
              <button
                className="favorite-button"
                style={{
                  backgroundColor: '#ccc',
                  color: 'white',
                  position: 'absolute', /* 버튼을 절대 위치로 설정 */
                  right: '10px' /* 오른쪽으로 정렬 */
                }}
                onClick={() => handleFavoriteClick(favorite)}
              >
                즐겨찾기 제거
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
